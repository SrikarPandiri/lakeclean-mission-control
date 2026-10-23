from typing import Dict, Any, Optional
from datetime import datetime, timedelta

def calculate_observation_freshness(observed_at: Optional[datetime]) -> float:
    """
    Calculates freshness score (0 - 100) based on hours elapsed since observation.
    < 6 hours: 100
    < 24 hours: 85
    < 48 hours: 70
    < 7 days: 50
    < 14 days: 30
    > 14 days: 15
    """
    if not observed_at:
        return 50.0  # Transparent fallback for missing observation timestamp
    
    now = datetime.utcnow()
    diff = now - observed_at
    hours = diff.total_seconds() / 3600.0
    
    if hours <= 6:
        return 100.0
    elif hours <= 24:
        return 85.0
    elif hours <= 48:
        return 70.0
    elif hours <= 168:  # 7 days
        return 50.0
    elif hours <= 336:  # 14 days
        return 30.0
    else:
        return 15.0

def calculate_priority_score(
    severity: Optional[float],
    waste_density: Optional[float],
    observed_at: Optional[datetime] = None,
    freshness: Optional[float] = None,
    runoff_exposure: Optional[float] = None,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculates explainable priority score:
    Priority Score = w_sev * Severity + w_den * Waste Density + w_fresh * Freshness + w_run * Runoff Exposure
    
    Handles missing factors transparently and produces full factor attribution.
    """
    default_weights = {
        "severity": 0.35,
        "density": 0.25,
        "freshness": 0.20,
        "runoff": 0.20
    }
    w = weights if weights else default_weights
    
    missing_factors = []
    
    # 1. Severity factor (0 - 100)
    if severity is None:
        norm_severity = 50.0
        missing_factors.append("severity (defaulted to 50.0)")
    else:
        norm_severity = max(0.0, min(100.0, float(severity)))
        
    # 2. Waste density factor (0 - 100)
    if waste_density is None:
        norm_density = 50.0
        missing_factors.append("waste_density (defaulted to 50.0)")
    else:
        norm_density = max(0.0, min(100.0, float(waste_density)))
        
    # 3. Observation freshness (0 - 100)
    if freshness is not None:
        norm_freshness = max(0.0, min(100.0, float(freshness)))
    elif observed_at is not None:
        norm_freshness = calculate_observation_freshness(observed_at)
    else:
        norm_freshness = 50.0
        missing_factors.append("observation_freshness (defaulted to 50.0 baseline)")
        
    # 4. Runoff exposure (0 - 100)
    if runoff_exposure is None:
        norm_runoff = 30.0
        missing_factors.append("runoff_exposure (defaulted to 30.0 nominal runoff)")
    else:
        norm_runoff = max(0.0, min(100.0, float(runoff_exposure)))

    w_sev = w.get("severity", 0.35)
    w_den = w.get("density", 0.25)
    w_fresh = w.get("freshness", 0.20)
    w_run = w.get("runoff", 0.20)
    total_w = w_sev + w_den + w_fresh + w_run

    # Normalized weights in case custom weights don't sum to 1
    if total_w > 0:
        w_sev /= total_w
        w_den /= total_w
        w_fresh /= total_w
        w_run /= total_w

    sev_contribution = w_sev * norm_severity
    den_contribution = w_den * norm_density
    fresh_contribution = w_fresh * norm_freshness
    run_contribution = w_run * norm_runoff

    final_score = round(sev_contribution + den_contribution + fresh_contribution + run_contribution, 2)
    final_score = max(0.0, min(100.0, final_score))

    # Priority category
    if final_score >= 75.0:
        priority_level = "CRITICAL"
    elif final_score >= 55.0:
        priority_level = "HIGH"
    elif final_score >= 35.0:
        priority_level = "MEDIUM"
    else:
        priority_level = "LOW"

    return {
        "priority_score": final_score,
        "priority_level": priority_level,
        "factors": {
            "severity": {"value": norm_severity, "weight": round(w_sev, 2), "contribution": round(sev_contribution, 2)},
            "waste_density": {"value": norm_density, "weight": round(w_den, 2), "contribution": round(den_contribution, 2)},
            "observation_freshness": {"value": norm_freshness, "weight": round(w_fresh, 2), "contribution": round(fresh_contribution, 2)},
            "runoff_exposure": {"value": norm_runoff, "weight": round(w_run, 2), "contribution": round(run_contribution, 2)}
        },
        "missing_factors": missing_factors,
        "formula": f"{round(w_sev, 2)}*Severity + {round(w_den, 2)}*Density + {round(w_fresh, 2)}*Freshness + {round(w_run, 2)}*Runoff"
    }
