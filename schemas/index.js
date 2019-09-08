// may be helpful: https://www.jsonschema.net/


module.exports.test_calcSummary = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id_submission": {
                "anyOf": [
                    {"type": "string"},
                    {"type": "null"}
                ]
            },
            "first_glance_location_score": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            },
            "first_glance_type_score": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            },
            "first_glance_total_score": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            },
        }
    }
};

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
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "team": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "player_id": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "app": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "test_date": {
                "type": "string"
            },
            "device": {
                "anyOf": [
                    {"type": "string"},
                    {"type": "null"}
                ]
            },
            "type_scores": {
                "type": "number"
            },
            "location_scores": {
                "type": "number"
            },
            "completely_correct_scores": {
                "type": "number"
            },
            "total_completely_correct_scores": {
                "type": "number"
            },
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
                "anyOf": [
                    {"type": "string"},
                    {"type": "number"}
                ]
            },
            "app": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "device": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
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

module.exports.drill_coachReport = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id_submission": {
                "type": "string"
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
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
            },
            "device": {
                "anyOf": [
                  {"type": "string"},
                  {"type": "null"}
                ]
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

module.exports.drill_usageDetail = {
    "type": "object",
    "properties": {
        "rows": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type_score_percent": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "location_score_percent": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "completely_correct_score_percent": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "type_score": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "location_score": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "completely_correct_score": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "count": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "user_id": {
                        "anyOf": [
                            {"type": "number"},
                            {"type": "null"}
                        ]
                    },
                    "pitcher_name": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                    "pitch": {
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
                    "correct_response_name": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                    "time_answered": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                    "playerFirstName": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                    "playerLastName": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                    "playerTeam": {
                        "anyOf": [
                            {"type": "string"},
                            {"type": "null"}
                        ]
                    },
                }
            }
        },
        "keys": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    }
};

module.exports.drill_completionSummary = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "count": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            }, "user_id": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            }, "month": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            }, "year": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            }, "date": {
                "anyOf": [
                    {"type": "date"},
                    {"type": "null"}
                ]
            }, "date_format": {
                "anyOf": [
                    {"type": "string"},
                    {"type": "null"}
                ]
            }

        }
    }
};

module.exports.drill_streakSummary = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "days": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            },
            "count": {
                "anyOf": [
                    {"type": "number"},
                    {"type": "null"}
                ]
            }
        }
    }
};