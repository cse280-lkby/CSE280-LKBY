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
                prompt: 'How are you feeling today?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        if (witResponse.entities.negative) {
                            return 'tempNegative';
                        }
                        return 'tempPositive';
                    }
                }
            },
        ],
        next: 'understanding_content'
    },
    tempNegative: {
        name: 'tempNegative',
        questions: [
            {
                name: 'negative',
                prompt: 'Tell me more.',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        if (witResponse.entities.exam) {
                            return 'tempExam';
                        }
                        else if (witResponse.entities.course_materials) {
                            return 'tempCourseMaterials';
                        }
                        else if (witResponse.entities.time_management) {
                            return 'tempTimeManagement';
                        }
                        return 'tempPositive';
                    }
                }
            },
        ],
        next: null
    },
    tempPositive: {
        name: 'tempPositive',
        questions: [
            {
                name: 'positive',
                prompt: 'That\'s great, have a nice rest of your day. Be sure to check back in tomorrow!',
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    return 'check_in'      ;              
                }
            },
        ],
        next: null
    },
    tempExam: {
        name: 'tempExam',
        questions: [
            {
                name: 'exam',
                prompt: 'Good resources to consider when struggling with test anxiety or test performance are tutors and '
                + 'the center for academic success.',
                /*prompt: 'Test anxiety is a very common problem among students, so know that you\'re not alone. '
                + 'Good resources to consider when struggling with test anxiety or test performance are tutors and '
                + 'the center for academic success.'
                + 'Those resources will help you to manage your time and help you understand the material prior to your exams. ',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    return 'check_in'      ;              
                }
            },
        ],
        next: null
    },
    tempCourseMaterials: {
        name: 'tempCourseMaterials',
        questions: [
            {
                name: 'course_materials',
                prompt: 'A few things that students find helpful when they don\'t understand material are finding a tutor, '
                + 'attending office hours, and finding a group of classmates to study with.',
                /*prompt: 'Not understanding content is a common issue, the courses are supposed to be challenging. '
                + 'A few things that students find helpful when they don\'t understand material, are finding a tutor, '
                + 'attending office hours, and finding a group of classmates to study with.',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    return 'check_in'      ;              
                }
            },
        ],
        next: null
    },
    tempTimeManagement: {
        name: 'tempTimeManagement',
        questions: [
            {
                name: 'time_management',
                prompt: 'In order to keep track of everything you need to accomplish try to '
                + ' create a planner for yourself and prioritize a list of things '
                + ' that you need to do. Make the list as specific as possible.',
                /*prompt: 'Managing your time is one of the most difficult aspects of college. In order to keep track of '
                + ' everything you need to accomplish try to create a planner for yourself and prioritize a list of things '
                + ' that you need to do. Make the list as specific as possible.  Students often see that when you write everything'
                + ' that must be done down on paper, the list seems more manageable than it was in your head.',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    return 'check_in'      ;              
                }
            },
        ],
        next: null
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