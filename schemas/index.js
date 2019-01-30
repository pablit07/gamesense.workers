// may be helpful: https://www.jsonschema.net/

module.exports.test_usageSummary = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "number_of_responses": {
                "type": "number"
            },
            "id_submission": {
                "type": "string"
            },
            "source_etl": {
                "type": "string"
            },
            "team": {
                "type": "string"
            },
            "player_id": {
                "type": "string"
            },
            "app": {
                "type": "string"
            },
            "test_date": {
                "type": "string"
            }
        }
    }
};

module.exports.drill_usageSummary = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id_submission": {
                "type": "string"
            },
            "team_name": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "player_first_name": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "player_last_name": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "drill": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "first_glance_total_score": {
                "type": "number"
            },
            "app": {
                "type": "string"
            },
            "completion_timestamp_formatted": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            }
        }
    }
};

module.exports.activity = {
    "type": "object",
    "properties": {
        "app": {
            "type": "string"
        },
        'activity_id': {
            "type": "string"
        },
        'user_id': {
            "type": "string"
        },
        'team': {
            "type": "string"
        },
        'team_id': {
            "type": "string"
        },
        'activity_name': {
            "type": "string"
        },
        'activity_value': {
            "type": "string"
        },
        'content_type_id': {
            "type": "string"
        },
        'object_id': {
            "type": "string"
        },
        'timestamp': {
            "type": "string"
        },
    }
};

module.exports.action = {
    "type": "object",
    "properties": {
        'id': {
            "type": "string"
        },
        'app': {
            "type": "string"
        },
        'user_id': {
            "type": "string"
        },
        'activity_id': {
            "type": "string"
        },
        'action_name': {
            "type": "string"
        },
        'action_value': {
            "type": "string"
        },
        'content_type_id': {
            "type": "string"
        },
        'object_id': {
            "type": "string"
        },
        'timestamp': {
            "type": "string"
        }
    }
};

module.exports.user = {
    "type": "object",
    "properties": {
        "app": {
            "type": "string"
        },
        "id": {
            "type": "string"
        },
        "first_name": {
            "type": "string"
        },
        "last_name": {
            "type": "string"
        },
        "team": {
            "type": "string"
        }
    }
};

module.exports.final_score_action = {
    "type": "object",
    "properties": {
        "id_submission":{
            "type": "string"
        },
        "Pitch Location Score": {
            "type": "number"
        },
        "Pitch Type Score": {
            "type": "number"
        },
        "Total Score": {
            "type": "number"
        }
    }
};

module.exports.userId = {
    "type": "object",
    "properties": {
        "app": {
            "type": "string"
        },
        "id": {
            "type": "string"
        }
    }
};

module.exports.userIds = {
    "type": "array",
    "items": module.exports.userId

}

module.exports.drill_sessions = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "drills": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "score": {
                            "type": "number"
                        },
                        "recommendation": {
                            "type": "string"
                        },
                        "decisionQualityFromLast": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
}

module.exports.singlePlayer = {
    "type": "object",
    "properties": {
        "player_id": {
            "anyOf": [
                {"type": "string"},
                {"type": "null"}
            ]
        },
        "id_submission": {
            "anyOf": [
                {"type": "string"},
                {"type": "null"}
            ]
        },
        "player_jersey_id": {
            "anyOf": [
                {"type": "string"},
                {"type": "null"}
            ]
        }
    }
}

module.exports.test_export = {
    
}