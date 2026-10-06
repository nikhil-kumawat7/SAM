// API utility for interacting with the Serverless API Gateway

const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL_HERE/Prod/api/exercises';

export const submitExerciseProfile = async (exercise: {
  name: string;
  target_muscle: string;
  mechanics_type: string;
  recommended_gear: string;
}) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exercise),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting exercise:', error);
    throw error;
  }
};

export const fetchTargetSpecificExercises = async (muscleRegion: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}?target=${encodeURIComponent(muscleRegion)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
};
