import json
import os
import uuid
import boto3
from boto3.dynamodb.conditions import Key

def get_table():
    # Deferred initialization for easier testing
    table_name = os.environ.get('TABLE_NAME')
    if not table_name:
        raise ValueError("TABLE_NAME environment variable is not set")
    dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table(table_name)

def create_exercise(event, context):
    """
    POST /api/exercises
    Creates a new biomechanical exercise profile.
    """
    try:
        table = get_table()
        body = json.loads(event.get('body', '{}'))
        
        name = body.get('name')
        target_muscle = body.get('target_muscle')
        mechanics_type = body.get('mechanics_type')
        recommended_gear = body.get('recommended_gear')
        
        if not name or not target_muscle:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "name and target_muscle are required fields"})
            }
            
        item_id = str(uuid.uuid4())
        
        item = {
            'id': item_id,
            'name': name,
            'target_muscle': target_muscle,
            'mechanics_type': mechanics_type,
            'recommended_gear': recommended_gear
        }
        
        table.put_item(Item=item)
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(item)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }

def get_exercises(event, context):
    """
    GET /api/exercises?target={muscle_region}
    Retrieves exercise profiles, optionally filtered by target_muscle.
    """
    try:
        table = get_table()
        query_params = event.get('queryStringParameters') or {}
        target_muscle = query_params.get('target')
        
        if target_muscle:
            # Query the Global Secondary Index for efficient retrieval
            response = table.query(
                IndexName='TargetMuscleIndex',
                KeyConditionExpression=Key('target_muscle').eq(target_muscle)
            )
            items = response.get('Items', [])
        else:
            # If no target provided, scan and return all (for demo purposes)
            response = table.scan()
            items = response.get('Items', [])
            
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(items)
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
