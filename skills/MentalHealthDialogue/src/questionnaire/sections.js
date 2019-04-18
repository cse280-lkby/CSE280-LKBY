const SLOT_TYPES = require('./slot-types');

/*
 * Sections:
 *  must contain a 'name', a list of 'questions' (at least 1), and can have a 'next'.
 *  Note: 'name' field must match the name of the key in the SECTIONS object.
 * 
 * Questions:
 *  must contain a 'name', 'prompt', 'type' (SLOT_TYPES.XXXX).
 *  Optional: 'useWit', 'reprompt', 'onResponse' (more below)
 *  Note: the first question has ID 0, second has ID 1, etc.
 * 
 * onResponse(value, witResponse?):
 *  Called when a question is answered.
 *  witResponse is either null or a Wit.ai response object if useWit=true.
 *  Possible returns:
 *   - A string to jump to a different section
 *   - Nothing to continue normal conversation flow.
 */

// List of survey sections.
const SECTIONS = {
    check_in: {
        name: 'check_in',
        questions: [
            {
                name: 'feeling',
                prompt: 'Hello! Welcome back. How are you feeling today?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', witResponse);
                    }
                }
            },
        ],
        next: 'understanding_content'
    },
    understanding_content: {
        name: 'understanding_content',
        questions: [
            {
                name: 'yes_no_content',
                prompt: "Are you having difficulty understanding content? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'motivation';
                }
            },{
                name: 'find_tutoring',
                prompt: "Have you attempted to find tutoring? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'reaching_out';
                }
            },{
                name: 'yes_no_find_tutor',
                prompt: "Were you able to find a tutor? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'reaching_out';
                }
            },{
                name: 'yes_no_tutor_helpful',
                prompt: "Was the tutor helpful? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'reaching_out';
                }
            },{
                name: 'why_helpful',
                prompt: "What about your tutoring experience made it helpful to you?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'reaching_out' // TODO: End conversation!
    },
    no_tutor: {
        name: 'no_tutor',
        questions: [
            {
                name: 'why_no_tutor',
                prompt: "What kept you from finding a tutor?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'reaching_out'
    },
    reaching_out: {
        name: 'reaching_out',
        questions: [
            {
                name: 'yes_no_reaching_out',
                prompt: "Are you interested in reaching out to your school\'s academic services center or to a third party tutoring service? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'friends';
                }
            },
        ],
        next: 'friends'
    },
    friends: {
        name: 'friends',
        questions: [
            {
                name: 'have_friends',
                prompt: "Do you have friends in the class or outside of class that could help you? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'talk_to_those_around';
                }
            },{
                name: 'work_together',
                prompt: "Have you reached out to these friends to work together and try to learn the material?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'office_hours'
    },    
    talk_to_those_around: {
        name: 'talk_to_those_around',
        questions: [
            {
                name: 'talk_to_those_around',
                prompt: "Have you tried talking to the people around you in class to form a study group?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'office_hours'
    },
    office_hours: {
        name: 'office_hours',
        questions: [
            {
                name: 'yes_no_attended',
                prompt: "Have you attended the professors’ office hours? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'office_hours_time';
                }
            },{
                name: 'helpful',
                prompt: "Have you found the office hours to be helpful?",
                type: SLOT_TYPES.YES_NO
            },
        ],
        next: 'motivation'
    },
    office_hours_time: {
        name: 'office_hours_time',
        questions: [
            {
                name: 'yes_no_good_time',
                prompt: "Does the professor hold office hours at a time when you are available? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'ask_prof_office_hours';
                }
            },{
                name: 'not_attending',
                prompt: "What is keeping you from attending these office hours?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'motivation'
    },
    ask_prof_office_hours: {
        name: 'ask_prof_office_hours',
        questions: [
            {
                name: 'yes_no_ask_for_time',
                prompt: "Have you asked to meet with the professor or teaching assistants at another time when you are available?",
                type: SLOT_TYPES.YES_NO
            },
        ],
        next: 'motivation'
    },
    motivation: {
        name: 'motivation',
        questions: [
            {
                name: 'yes_no_motivation',
                prompt: "Do you feel that you are lacking motivation?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not having other issues, skip to medication section
                    if (input === 'no') return 'time_management';
                }
            },{
                name: 'do_instead',
                prompt: "What would you rather be doing instead of studying or doing work?",
                type: SLOT_TYPES.OPEN_ENDED
            },
            {
                name: 'friends',
                prompt: "Are your friends distracting you from your work?",
                type: SLOT_TYPES.OPEN_ENDED
            },
            {
                name: 'sleep',
                prompt: "Do you feel that you are sleeping enough to have energy to do your work?",
                type: SLOT_TYPES.OPEN_ENDED
            },
            {
                name: 'interest',
                prompt: "Are you interested in what you’re studying?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'time_management'
    },
    time_management: {
        name: 'time_management',
        questions: [
            {
                name: 'yes_no_time_management',
                prompt: "Do you feel like you struggle with time management?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    // If the user is not taking medication, skip to history section
                    if (input === 'no') return 'spreading_too_thin';
                }
            },{
                name: 'cramming',
                prompt: "Do you feel like you’re always cramming before an assignment is due or a test?",
                type: SLOT_TYPES.YES_NO
            },{
                name: 'too_much_work',
                prompt: "Do you feel like you have too much to do with the amount of time available?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'relax',
                prompt: "Do you give yourself time to relax and do things for yourself?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'social',
                prompt: "Do you have time to be social and hang out with friends?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'rest_and_sleep',
                prompt: "Do you have time to receive ample rest and sleep?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'spreading_too_thin'
    },
    spreading_too_thin: {
        name: 'spreading_too_thin',
        questions: [
            {
                name: 'yes_no_spreading_thin',
                prompt: "Do you feel that you're spreading yourself too thin?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'test_anxiety';
                }
            },{
                name: 'yes_no_activities',
                prompt: "Are you a part of a club, athletic team, or other extracurricular activity? Or do you work part-time?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'cause_spreading_thin';
                }
            },{
                name: 'what_activities',
                prompt: "What are you currently participating in?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'how_much_time',
                prompt: "How much time a week does this extra activity take up?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'remove_option',
                prompt: "Do you think this problem could be minimized with better time management? Or do you think you need to remove yourself from an activity?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'self_care',
                prompt: "Do you feel that you are giving yourself enough time to take care of yourself with sleep, relaxing, eating, and being with friends?",
                type: SLOT_TYPES.OPEN_ENDED
            },            
        ],
        next: 'test_anxiety'
    },
    cause_spreading_thin: {
        name: 'cause_spreading_thin',
        questions: [
            {
                name: 'possible_cause',
                prompt: "What do you feel is causing you to feel you’re spread too thin?",
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: 'test_anxiety'
    },
    test_anxiety: {
        name: 'test_anxiety',
        questions: [
            {
                name: 'yes_no_test_anxiety',
                prompt: "Do you feel that you get test anxiety?",
                type: SLOT_TYPES.YES_NO
            },{
                name: 'yes_no_prepared',
                prompt: "Do you feel that you typical go into tests well prepared? Please answer yes or no.",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'other';
                }
            },{
                name: 'what_cause',
                prompt: "What do you think causes your anxiety leading up to tests?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'time_management',
                prompt: "Do you feel that you struggle with time management and that is keeping you from being fully prepared?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'sleep',
                prompt: "Do you get enough sleep leading up to exams?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'people_around',
                prompt: "Do the people around you add to or minimize your stress?",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'other'
    },
    other: { // TODO: How to implement allowing users to ask for more info on different methods?
        name: 'other',
        questions: [
            {
                name: 'other_problem',
                prompt: "If your main issue hasn\'t been covered yet, what seems to be bothering you?",
                type: SLOT_TYPES.OPEN_ENDED
            },{
                name: 'reaching_out_to_others',
                prompt: "Have you attempted to reach out to available faculty or friends?",
                type: SLOT_TYPES.YES_NO
            },{
                name: 'problem_cause',
                prompt: "Do you know what could be causing this problem? If so, please explain.",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'schedule_counseling_appointment'
    },
    schedule_counseling_appointment: {
        name: 'schedule_appointment',
        questions: [
            {
                name: 'want_counseling_appointment',
                prompt: "Do you want help scheduling an appointment with a counsellor to help you with this problem at the counseling center?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'schedule_tutoring_help';
                }
            },{
                name: 'counseling_contact_number',
                prompt: "To schedule an appointment please call  610 758 3880 or visit the Counseling and Psychological Services section of the Lehigh Student Affairs website.",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'schedule_tutoring_help'
    },
    schedule_tutoring_help: {
        name: 'schedule_tutoring_help',
        questions: [
            {
                name: 'want_tutoring_appointment',
                prompt: "Do you want help contacting the tutoring center to find a tutor?",
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if (input === 'no') return 'ending';
                }
            },{
                name: 'tutoring_contact_information',
                prompt: "To find tutoring options check out the Center for Academic Success website or visit the math and writing center in Drown Hall.",
                type: SLOT_TYPES.OPEN_ENDED
            },
        ],
        next: 'ending' // TODO
    },
    ending: {
        name: 'ending',
        questions: [
            {
                name: 'first_top_trigger',
                // TODO: Can this be customized to list *what the client likes about smoking*
                prompt: "",
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: '' // TODO
    },
    __main__: 'check_in',
    __version__: '1',
};

module.exports = SECTIONS;