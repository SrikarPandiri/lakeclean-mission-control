import pytest
from backend.app.services.simulator import MissionSimulationService
from backend.app.models.models import MissionPlan

def test_simulation_lifecycle_transitions(db):
    mission = db.query(MissionPlan).filter(MissionPlan.status == "PLANNED").first()
    assert mission is not None
    m_id = mission.id

    # 1. Start
    started = MissionSimulationService.start_mission(db, m_id)
    assert started.status == "RUNNING"
    assert started.started_at is not None

    # 2. Pause
    paused = MissionSimulationService.pause_mission(db, m_id)
    assert paused.status == "PAUSED"

    # 3. Resume
    resumed = MissionSimulationService.resume_mission(db, m_id)
    assert resumed.status == "RUNNING"

    # 4. Tick
    tick_res = MissionSimulationService.tick_mission(db, m_id)
    assert tick_res["status"] == "RUNNING"
    assert tick_res["current_waypoint_index"] > 0
    assert tick_res["current_battery_pct"] <= 100.0

    # 5. Abort
    aborted = MissionSimulationService.abort_mission(db, m_id, reason="Testing manual abort")
    assert aborted.status == "ABORTED"
    assert aborted.completed_at is not None

def test_invalid_state_transitions(db):
    mission = db.query(MissionPlan).filter(MissionPlan.status == "COMPLETED").first()
    assert mission is not None

    # Cannot pause a completed mission
    with pytest.raises(ValueError):
        MissionSimulationService.pause_mission(db, mission.id)

    # Cannot abort an already completed mission
    with pytest.raises(ValueError):
        MissionSimulationService.abort_mission(db, mission.id)
