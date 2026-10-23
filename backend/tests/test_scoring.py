from datetime import datetime, timedelta
from backend.app.services.scoring import calculate_priority_score, calculate_observation_freshness

def test_scoring_standard_weights():
    # Severity 80, Density 60, Freshness 100, Runoff 50
    # Expected: 0.35*80 + 0.25*60 + 0.20*100 + 0.20*50 = 28 + 15 + 20 + 10 = 73.0
    result = calculate_priority_score(
        severity=80.0,
        waste_density=60.0,
        freshness=100.0,
        runoff_exposure=50.0
    )
    assert result["priority_score"] == 73.0
    assert result["priority_level"] == "HIGH"
    assert "factors" in result
    assert result["factors"]["severity"]["value"] == 80.0

def test_scoring_missing_factors_transparency():
    # When freshness and runoff are None, fallback defaults must be used and logged in missing_factors
    result = calculate_priority_score(
        severity=70.0,
        waste_density=50.0,
        freshness=None,
        observed_at=None,
        runoff_exposure=None
    )
    assert "priority_score" in result
    assert len(result["missing_factors"]) >= 2
    assert any("observation_freshness" in m for m in result["missing_factors"])
    assert any("runoff_exposure" in m for m in result["missing_factors"])

def test_observation_freshness_decay():
    now = datetime.utcnow()
    fresh_recent = calculate_observation_freshness(now - timedelta(hours=2))
    assert fresh_recent == 100.0

    medium_fresh = calculate_observation_freshness(now - timedelta(hours=36))
    assert medium_fresh == 70.0

    stale_fresh = calculate_observation_freshness(now - timedelta(days=20))
    assert stale_fresh == 15.0

    none_fresh = calculate_observation_freshness(None)
    assert none_fresh == 50.0

def test_clamping_boundary_scores():
    result = calculate_priority_score(
        severity=150.0,
        waste_density=-20.0,
        freshness=120.0,
        runoff_exposure=-10.0
    )
    assert result["factors"]["severity"]["value"] == 100.0
    assert result["factors"]["waste_density"]["value"] == 0.0
    assert result["factors"]["observation_freshness"]["value"] == 100.0
    assert result["factors"]["runoff_exposure"]["value"] == 0.0
