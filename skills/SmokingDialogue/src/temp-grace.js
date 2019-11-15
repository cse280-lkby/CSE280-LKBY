// Temporarily used so that user "grace" in text server has quit date in the past always
module.exports = {
    "eventLog": [
        {
            "time": 1573596116064,
            "type": "questionnaire_started"
        },
        {
            "time": 1573596116064,
            "type": "prompt",
            "data": {
                "section": "onboarding",
                "question": "vape_or_smoke",
                "prompt": "To start off, I'd like to learn more about you. Do you primarily smoke or vape?",
                "suggestions": [
                    "I primarily smoke",
                    "I primarily vape"
                ]
            }
        },
        {
            "time": 1573596117455,
            "type": "user_response",
            "data": {
                "section": "onboarding",
                "question": "vape_or_smoke",
                "userResponse": "I primarily vape"
            }
        },
        {
            "time": 1573596117942,
            "type": "wit_result",
            "data": {
                "userResponse": "I primarily vape",
                "witData": {
                    "_text": "I primarily vape",
                    "entities": {
                        "smoke_or_vape": [
                            {
                                "confidence": 0.98130836456107,
                                "value": "vape",
                                "type": "value"
                            }
                        ]
                    },
                    "msg_id": "1NI8ey1T2FSZCho4o"
                }
            }
        },
        {
            "time": 1573596117943,
            "type": "prompt",
            "data": {
                "section": "onboarding",
                "question": "date_last_smoked",
                "prompt": "When was the last time you vaped?",
                "suggestions": [
                    "Today",
                    "Yesterday",
                    "A few days ago",
                    "A week ago or more"
                ]
            }
        },
        {
            "time": 1573596119021,
            "type": "user_response",
            "data": {
                "section": "onboarding",
                "question": "date_last_smoked",
                "userResponse": "Yesterday"
            }
        },
        {
            "time": 1573596119198,
            "type": "wit_result",
            "data": {
                "userResponse": "Yesterday",
                "witData": {
                    "_text": "Yesterday",
                    "entities": {
                        "quit_date": [
                            {
                                "confidence": 0.96026231528699,
                                "values": [
                                    {
                                        "value": "2019-11-11T00:00:00.000-05:00",
                                        "grain": "day",
                                        "type": "value"
                                    }
                                ],
                                "value": "2019-11-11T00:00:00.000-05:00",
                                "grain": "day",
                                "type": "value"
                            }
                        ]
                    },
                    "msg_id": "1PMsOExY5IdPRxtGj"
                }
            }
        },
        {
            "time": 1573596119199,
            "type": "prompt",
            "data": {
                "section": "onboarding",
                "question": "duration_of_pod_or_pack",
                "prompt": "How long does a single pod usually last for you?",
                "suggestions": [
                    "About one day",
                    "A few days",
                    "About a week",
                    "A month"
                ]
            }
        },
        {
            "time": 1573596119909,
            "type": "user_response",
            "data": {
                "section": "onboarding",
                "question": "duration_of_pod_or_pack",
                "userResponse": "A few days"
            }
        },
        {
            "time": 1573596120077,
            "type": "wit_result",
            "data": {
                "userResponse": "A few days",
                "witData": {
                    "_text": "A few days",
                    "entities": {
                        "duration": [
                            {
                                "confidence": 0.98155228392132,
                                "value": 3,
                                "day": 3,
                                "type": "value",
                                "unit": "day",
                                "normalized": {
                                    "value": 259200,
                                    "unit": "second"
                                }
                            }
                        ]
                    },
                    "msg_id": "1d4fAaawQ1eANh3Fg"
                }
            }
        },
        {
            "time": 1573596120078,
            "type": "prompt",
            "data": {
                "section": "onboarding",
                "question": "reasons_for_smoking",
                "prompt": "Here's a question you probably weren't expecting, what made you start vaping?",
                "suggestions": [
                    "Friends",
                    "Boredom",
                    "School",
                    "Depression",
                    "Stress",
                    "Cool"
                ]
            }
        },
        {
            "time": 1573596120761,
            "type": "user_response",
            "data": {
                "section": "onboarding",
                "question": "reasons_for_smoking",
                "userResponse": "School"
            }
        },
        {
            "time": 1573596120974,
            "type": "wit_result",
            "data": {
                "userResponse": "School",
                "witData": {
                    "_text": "School",
                    "entities": {
                        "reasons_for_smoking": [
                            {
                                "confidence": 0.79693670342589,
                                "value": "school",
                                "type": "value"
                            }
                        ]
                    },
                    "msg_id": "15uBXHi25X8Vv2J0o"
                }
            }
        },
        {
            "time": 1573596120976,
            "type": "prompt",
            "data": {
                "section": "onboarding",
                "question": "reasons_for_quitting",
                "prompt": "I'm wondering if a recent event inspired you to quit. What are your main reasons for quitting now?",
                "suggestions": [
                    "Feeling sick",
                    "Too expensive",
                    "Disgust",
                    "Others"
                ]
            }
        },
        {
            "time": 1573596121457,
            "type": "user_response",
            "data": {
                "section": "onboarding",
                "question": "reasons_for_quitting",
                "userResponse": "Too expensive"
            }
        },
        {
            "time": 1573596121645,
            "type": "wit_result",
            "data": {
                "userResponse": "Too expensive",
                "witData": {
                    "_text": "Too expensive",
                    "entities": {
                        "reasons_for_quitting": [
                            {
                                "entities": {
                                    "emotion": [
                                        {
                                            "suggested": true,
                                            "confidence": 0.89049309941288,
                                            "value": "expensive",
                                            "type": "value"
                                        }
                                    ]
                                },
                                "confidence": 0.97936790069484,
                                "value": "expensive",
                                "type": "value"
                            }
                        ]
                    },
                    "msg_id": "1UVx2HE7sA61dHOo0"
                }
            }
        },
        {
            "time": 1573596121646,
            "type": "handler_response",
            "data": {
                "response": "You are not alone. School is a common social situation where peer pressure has a lot of influence. Vaping is much more expensive than most people realize. Quitting can save you a lot of money. I think now is a good time for you to set a quit date. "
            }
        },
        {
            "time": 1573596121647,
            "type": "handler_redirect",
            "data": {
                "section": "set_quit_date"
            }
        },
        {
            "time": 1573596121647,
            "type": "prompt",
            "data": {
                "section": "set_quit_date",
                "question": "quit_date",
                "prompt": "When do you think you would like to be done with vaping?",
                "suggestions": [
                    "In a few days",
                    "In a week",
                    "In a month"
                ]
            }
        },
        {
            "time": 1573596122225,
            "type": "user_response",
            "data": {
                "section": "set_quit_date",
                "question": "quit_date",
                "userResponse": "In a week"
            }
        },
        {
            "time": 1573596122410,
            "type": "wit_result",
            "data": {
                "userResponse": "In a week",
                "witData": {
                    "_text": "In a week",
                    "entities": {
                        "quit_date": [
                            {
                                "confidence": 0.98847671118659,
                                "values": [
                                    {
                                        "value": "2019-11-19T00:00:00.000-05:00",
                                        "grain": "day",
                                        "type": "value"
                                    }
                                ],
                                "value": "2019-11-19T00:00:00.000-05:00",
                                "grain": "day",
                                "type": "value"
                            }
                        ]
                    },
                    "msg_id": "1Ezh03Rln8XRtOh4X"
                }
            }
        },
        {
            "time": 1573596122428,
            "type": "handler_response",
            "data": {
                "response": "Sounds great. I'm looking forward to helping you quit by November 19! Let's talk again soon!"
            }
        },
        {
            "time": 1573596122429,
            "type": "questionnaire_finished",
            "data": {
                "finalMessage": ""
            }
        }
    ],
    "questionnaire": {
        "__start_time__": "2019-11-12T22:01:56.064Z",
        "onboarding": {
            "vape_or_smoke": "I primarily vape",
            "date_last_smoked": "Yesterday",
            "duration_of_pod_or_pack": "A few days",
            "reasons_for_smoking": "School",
            "reasons_for_quitting": "Too expensive"
        },
        "set_quit_date": {
            "quit_date": "In a week"
        },
        "__finished__": true
    },
    "qUserData": {
        "__start_time__": "2019-11-12T22:01:56.064Z",
        "smokeOrVape": "vape",
        "dateLastSmoked": "2019-11-11T05:00:00.000Z",
        "podOrPackDuration": 259200,
        "reasonsForSmoking": [
            "school"
        ],
        "onboarded": true,
        "reasonsForQuitting": [
            "expensive"
        ],
        "quitDate": "2019-11-01T05:00:00.000Z"
    }
};