import pytest
from src.metrics import calculate_tonnage

def test_calculate_tonnage_success():
    """Test successful volume calculation (Sets * Reps * Weight)"""
    # Example: 3 sets of 10 reps at 100 lbs = 3000
    assert calculate_tonnage(sets=3, reps=10, weight=100) == 3000
    assert calculate_tonnage(sets=5, reps=5, weight=225) == 5625

def test_calculate_tonnage_missing_variables():
    """Test handling of missing variables"""
    with pytest.raises(ValueError, match="Sets, reps, and weight must be provided"):
        calculate_tonnage(None, 10, 100)
    
    with pytest.raises(ValueError, match="Sets, reps, and weight must be provided"):
        calculate_tonnage(3, None, 100)

def test_calculate_tonnage_edge_cases():
    """Test edge cases like zero and negative inputs"""
    # 0 weight or 0 reps should yield 0 tonnage
    assert calculate_tonnage(3, 10, 0) == 0
    assert calculate_tonnage(3, 0, 100) == 0
    
    # Negative values should raise an error
    with pytest.raises(ValueError, match="Values cannot be negative"):
        calculate_tonnage(3, 10, -50)
