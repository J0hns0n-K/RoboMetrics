"""Independent one-run audit; refuses to overwrite its published result."""
import datetime
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent.parent
def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))
def digest(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()
def close(x, y):
    assert math.isclose(x, y, rel_tol=1e-12, abs_tol=1e-12), (x, y)

output = ROOT / 'data/learning/equal-turn-run-lengths-run-01.json'
if output.exists():
    raise FileExistsError('Use new artifact names and protocol for a new run.')
protocol_name = 'experiments/equal-turn-run-lengths-01.protocol.json'
protocol = read(protocol_name)
config = read(protocol['config'])
prediction = read(protocol['studentPrediction'])
prior = read(protocol['priorValidation'])
for name, expected in prior['validation']['sha256Bytes'].items():
    assert digest(name) == expected, name
fallback = read(prior['tests']['priorRecord'])
test_files = git('ls-files', 'test/*.test.mjs').splitlines()
assert test_files == fallback['tests']['testFiles']
assert digest(prior['tests']['archive']) == prior['tests']['sha256Bytes']
files = list(prior['validation']['sha256Bytes']) + [
    protocol['priorValidation'], protocol_name, protocol['config'],
    protocol['studentPrediction'], protocol['wrapper'],
    'experiments/validate-equal-turn-run-lengths-01.py',
    'data/learning/candidate-astar-direct-interpretation-01.json',
] + git('ls-files', 'src/*.mjs').splitlines()
before = {name: digest(name) for name in files}
source = git('rev-parse', 'HEAD')
node = shutil.which('node') or str(Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')
command = "const {results}=await import('./practice/19-equal-turn-run-lengths.mjs');process.stderr.write(JSON.stringify(results));"
process = subprocess.run([node, '--input-type=module', '-e', command], cwd=ROOT, capture_output=True)
assert process.returncode == 0, process.stderr.decode('utf-8')
results = json.loads(process.stderr)
assert len(results) == len(config['candidates']) == 2
limits = config['motionLimits']
v, a = limits['linearSpeed'], limits['linearAcceleration']
w, alpha = limits['angularSpeedDegrees'], limits['angularAccelerationMagnitudeDegreesPerSecondSquared']
assert (limits['initialHeading'], limits['stopPolicy']) == ('down', 'turns-only')
assert (v, a, w, alpha) == (2, 1, 180, 360)
angles_by_heading = {'right': 0, 'down': 90, 'left': 180, 'up': 270}
letters = {'right': 'R', 'down': 'D', 'left': 'L', 'up': 'U'}
def reference_time(extent, cap, acceleration):
    transition = cap * cap / acceleration
    if extent <= transition:
        return 2 * math.sqrt(extent / acceleration)
    return extent / cap + cap / acceleration

audits = []
profile_count = phase_count = 0
world = config['world']
assert world['blockedCells'] == []
for candidate, row in zip(config['candidates'], results):
    assert all(row[key] == value for key, value in candidate.items())
    path, timing = row['path'], row['timing']
    assert path[0] == world['start'] and path[-1] == world['goal']
    assert all(type(x) is int and type(y) is int and 0 <= x < world['width'] and 0 <= y < world['height'] for x, y in path)
    runs = []
    for p, q in zip(path, path[1:]):
        dx, dy = q[0] - p[0], q[1] - p[1]
        assert abs(dx) + abs(dy) == 1
        heading = 'right' if dx > 0 else 'left' if dx < 0 else 'down' if dy > 0 else 'up'
        if runs and runs[-1][0] == heading:
            runs[-1][1] += 1
        else:
            runs.append([heading, 1])
    assert ''.join(letters[h] * length for h, length in runs) == row['sequence']
    assert [length for h, length in runs] == row['straightRunLengths']
    assert len(path) - 1 == timing['worldLength'] == 8
    assert abs(path[-1][0] - path[0][0]) + abs(path[-1][1] - path[0][1]) == 8
    assert timing['translationRuns'] == len(runs) == 3
    assert timing['directionChanges'] == timing['intermediateStops'] == 2
    assert runs[0][0] == runs[-1][0] == 'down'
    previous_heading = limits['initialHeading']
    rotation_angles = []
    for heading, length in runs:
        delta = abs(angles_by_heading[heading] - angles_by_heading[previous_heading])
        angle = min(delta, 360 - delta)
        if angle:
            rotation_angles.append(angle)
        previous_heading = heading
    assert rotation_angles == [90, 90] and timing['initialAlignmentDegrees'] == 0
    assert timing['totalRotationDegrees'] == timing['pathRotationDegrees'] == 180
    translation_times = [reference_time(length, v, a) for h, length in runs]
    rotation_times = [reference_time(angle, w, alpha) for angle in rotation_angles]
    close(timing['translationSeconds'], sum(translation_times))
    close(timing['rotationSeconds'], sum(rotation_times))
    close(timing['modelSeconds'], sum(translation_times) + sum(rotation_times))
    translations = [op for op in timing['operations'] if op['kind'] == 'translate']
    rotations = [op for op in timing['operations'] if op['kind'] == 'rotate']
    assert len(translations) == 3 and len(rotations) == timing['rotationOperations'] == 2
    peaks = [min(v, math.sqrt(a * length)) for heading, length in runs]
    for op, (heading, length), peak in zip(translations, runs, peaks):
        assert op['heading'] == heading and op['length'] == length
        close(op['profile']['peakSpeed'], peak)
    assert [op['angleDegrees'] for op in rotations] == rotation_angles
    clock = 0
    for op in timing['operations']:
        close(op['startSeconds'], clock)
        clock = op['endSeconds']
        close(clock - op['startSeconds'], op['durationSeconds'])
        if op['kind'] == 'translate':
            cap, acc, extent = v, a, op['length']
            time_key, u_key, z_key, acc_key, extent_key = 'duration', 'initialSpeed', 'finalSpeed', 'acceleration', 'distance'
        else:
            cap, acc, extent = w, alpha, op['angleDegrees']
            time_key, u_key, z_key, acc_key, extent_key = 'durationSeconds', 'initialAngularSpeedDegreesPerSecond', 'finalAngularSpeedDegreesPerSecond', 'angularAccelerationDegreesPerSecondSquared', 'angleDegrees'
        close(op['durationSeconds'], reference_time(extent, cap, acc))
        phases = op['profile']['phases']
        assert phases[0][u_key] == phases[-1][z_key] == 0
        total_extent = total_time = 0
        for i, phase in enumerate(phases):
            u, z, duration = phase[u_key], phase[z_key], phase[time_key]
            acceleration = (z - u) / duration
            assert duration > 0 and 0 <= min(u, z) <= max(u, z) <= cap + 1e-10 and abs(acceleration) <= acc + 1e-10
            close(acceleration, phase[acc_key])
            if i:
                close(phases[i - 1][z_key], u)
            dt = duration / 64
            integral = sum(((u + acceleration * dt * j) + (u + acceleration * dt * (j + 1))) * dt / 2 for j in range(64))
            close(integral, phase[extent_key])
            total_extent += integral
            total_time += duration
            phase_count += 1
        close(total_extent, extent)
        close(total_time, op['durationSeconds'])
        profile_count += 1
    close(clock, timing['modelSeconds'])
    audits.append({'id': row['id'], 'sequence': row['sequence'], 'moves': 8, 'initialAlignmentDegrees': 0,
                   'internalTurns': 2, 'rotationAnglesDegrees': rotation_angles, 'runs': runs,
                   'translationPeakSpeeds': peaks, 'translationRunModelSeconds': translation_times,
                   'translationModelSeconds': sum(translation_times), 'rotationModelSeconds': sum(rotation_times),
                   'totalModelSeconds': sum(translation_times) + sum(rotation_times), 'matches': True})
assert (profile_count, phase_count) == (10, 20)
assert all(digest(name) == expected for name, expected in before.items())
gap = results[1]['timing']['modelSeconds'] - results[0]['timing']['modelSeconds']
supported = prediction['selectedPrediction'] == 'route1-faster' and gap > 0
record = {
    'schemaVersion': 1, 'clientDateSeoul': '2026-11-03',
    'executedAtUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceCommit': source, 'operator': 'AI assistant CLI', 'protocol': protocol_name,
    'config': protocol['config'], 'studentPrediction': protocol['studentPrediction'],
    'configuredRun': {'commandSource': command, 'exitCode': process.returncode,
                      'stdout': process.stdout.decode('utf-8'),
                      'diagnosticStreamPurpose': 'stderr carries exported JSON, not errors', 'results': results},
    'tests': {'rerun': False, 'priorRecord': protocol['priorValidation'], 'passedPreviously': 166, 'failedPreviously': 0,
              'testFiles': test_files, 'archive': prior['tests']['archive'], 'sha256Bytes': digest(prior['tests']['archive']),
              'reason': 'All31tracked test files and prior frozen source/dependency hashes unchanged. New wrapper/protocol checked by configured execution and independent Python audit, not a new production-model implementation.'},
    'validation': {'command': protocol['validationCommand'], 'independentPathAndTimingAudit': audits,
                   'selectedProfilesAudited': profile_count, 'selectedPhasesAudited': phase_count,
                   'integrationPanelsPerPhase': 64, 'sourceInputsAndHistoricalBytesUnchanged': True,
                   'sha256Bytes': before,
                   'configuredCounts': {'timingEvaluations': 2, 'suppliedPaths': 2, 'knownPointLayouts': 1,
                                        'newIndependentResearchMaps': 0, 'astarCalls': 0, 'greedyCalls': 0, 'bfsCalls': 0}},
    'observations': {'route2MinusRoute1ModelSeconds': gap, 'studentQualitativeForecastSupportedHere': supported,
                     'explanationAuthor': 'AI assistant',
                     'interpretation': 'Equal moves, initial alignment, turn angles and counts do not fix bounded time at these limits. Different straight-run lengths change achieved peaks and the sum of rest-to-rest translation times; rotation times match.'},
    'roles': {'student': 'Prior choice1 only, without reason or numeric prediction, new path design, code or observed execution.',
              'ai': 'Path/limits/control design, wrapper, operation, independent validation program/formulas and detailed explanation.'},
    'scope': 'Known two-path control at shared speed cap2/linear acceleration1/initial-down/turns-only/angular cap180/angular acceleration360. Not directly comparable as a single-factor intervention against the old cap1 six-move control. No search budget, global optimum, physical body/actuation/calibration/controller/runtime/energy validation or hardware-purchase evidence.'
}
with output.open('x', encoding='utf-8', newline='\n') as stream:
    json.dump(record, stream, ensure_ascii=False, indent=2)
    stream.write('\n')
print(json.dumps({'source': source, 'audits': audits, 'gapModelSeconds': gap, 'forecastSupportedHere': supported,
                  'profiles': profile_count, 'phases': phase_count, 'historicalHashes': len(before)}))
