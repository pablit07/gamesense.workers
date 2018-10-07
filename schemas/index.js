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