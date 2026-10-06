def calculate_tonnage(sets, reps, weight):
    """
    Calculates total weekly tonnage for a given exercise.
    Formula: Sets x Reps x Weight
    """
    if sets is None or reps is None or weight is None:
        raise ValueError("Sets, reps, and weight must be provided.")
        
    if sets < 0 or reps < 0 or weight < 0:
        raise ValueError("Values cannot be negative.")
        
    return sets * reps * weight
