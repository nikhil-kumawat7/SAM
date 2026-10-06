import json
import os
import pytest
import boto3
from moto import mock_aws

# Set default region for boto3 before importing the app
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

from src.app import create_exercise, get_exercises

@pytest.fixture
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    os.environ["TABLE_NAME"] = "TestExercisesTable"

@pytest.fixture
def dynamodb_mock(aws_credentials):
    """Mocked DynamoDB table."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        dynamodb.create_table(
            TableName="TestExercisesTable",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "id", "AttributeType": "S"},
                {"AttributeName": "target_muscle", "AttributeType": "S"}
            ],
            GlobalSecondaryIndexes=[{
                "IndexName": "TargetMuscleIndex",
                "KeySchema": [{"AttributeName": "target_muscle", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }],
            BillingMode="PAY_PER_REQUEST"
        )
        yield dynamodb

def test_create_exercise_success(dynamodb_mock):
    """Test successful submission of an exercise profile."""
    event = {
        "body": json.dumps({
            "name": "Barbell Bench Press",
            "target_muscle": "sternal head of the pectoralis major",
            "mechanics_type": "compound",
            "recommended_gear": "wrist wraps"
        })
    }
    response = create_exercise(event, None)
    
    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    
    assert body["name"] == "Barbell Bench Press"
    assert "id" in body

def test_create_exercise_missing_fields(dynamodb_mock):
    """Test validation errors on exercise creation."""
    event = {
        "body": json.dumps({
            "name": "Incomplete Exercise"
            # Missing target_muscle
        })
    }
    response = create_exercise(event, None)
    
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert "error" in body

def test_get_target_specific_exercises(dynamodb_mock):
    """Test retrieval of exercises matching a highly specific muscle region."""
    # Seed the mock database
    create_exercise({
        "body": json.dumps({
            "name": "Incline Dumbbell Flyes",
            "target_muscle": "clavicular head of the pectoralis major"
        })
    }, None)
    
    create_exercise({
        "body": json.dumps({
            "name": "Decline Bench Press",
            "target_muscle": "abdominal head of the pectoralis major"
        })
    }, None)
    
    # Query API for clavicular head
    event = {
        "queryStringParameters": {
            "target": "clavicular head of the pectoralis major"
        }
    }
    response = get_exercises(event, None)
    
    assert response["statusCode"] == 200
    items = json.loads(response["body"])
    
    # We should only get the one matching exercise
    assert len(items) == 1
    assert items[0]["name"] == "Incline Dumbbell Flyes"

def test_get_exercises_no_match(dynamodb_mock):
    """Test retrieval when no exercises match."""
    event = {
        "queryStringParameters": {
            "target": "non-existent muscle"
        }
    }
    response = get_exercises(event, None)
    
    assert response["statusCode"] == 200
    items = json.loads(response["body"])
    
    # Should return empty array
    assert isinstance(items, list)
    assert len(items) == 0
