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
	    "id": {
	      "type": "string"
	    },
	    "activity_id": {
	      "type": "string"
	    },
	    "action_value": {
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
			"type": "string"
		},
		"id_submission": {
			"type": "string"
		},
		"player_jersey_id": {
			"type": "string"
		}
	}
}
