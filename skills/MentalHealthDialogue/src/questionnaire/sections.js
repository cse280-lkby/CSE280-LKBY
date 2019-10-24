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
// Decide which section to run first.
    __main__() {
        
         let {name} = this.userData;
         if (!name) {
             return 'firstTime';
         }
        

        // // Convert quitDate to Date if it is not already
        // if (typeof quitDate === 'string') {
        //     quitDate = new Date(quitDate);
        // }

        // // Check if quit date has passed
        // if (Date.now() > quitDate.getTime()) {
        //     return 'quit_date_passed';
        // }

        // return 'quit_date_upcoming';
        return 'check_in';
    },

    // set_quit_date: {
    //     name: 'set_quit_date',
    //     questions: [
    //         {
    //             name: 'quit_date',
    //             prompt: 'By which date would you like to quit?',
    //             type: SLOT_TYPES.OPEN_ENDED,
    //             useWit: true,
    //             onResponse(input, witResponse) {
    //                 const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'onboarding' };
    //                 if (witResponse == null || witResponse.entities == null) {
    //                     return errorResponse;
    //                 }
    //                 console.log('Got response from Wit API!', JSON.stringify(witResponse));

    //                 const {quit_date} = witResponse.entities;
    //                 if (quit_date == null) {
    //                     return errorResponse;
    //                 }

    //                 const dateStr = quit_date[0].value;
    //                 if (quit_date == null) {
    //                     return errorResponse;
    //                 }

    //                 const date = new Date(dateStr);
    //                 console.log('Raw date: ', dateStr, ", parsed: ", date);
    //                 if (date.getTime() <= Date.now()) {
    //                     return {
    //                         response: 'Sorry, I think that date is in the past.',
    //                         next: 'onboarding',
    //                     }
    //                 }

    //                 this.context.quitDate = date;
    //                 this.userData.quitDate = date;
    //             }
    //         }
    //     ],
    //     next: ''
    // },

    firstTime: {
        name: 'firstTime',
        questions: [
            {
                name: 'getName',
                 prompt: 'Hi, I am your College Buddy, nice to meet you. First, what can I call you when speaking with you?',
                 type: SLOT_TYPES.OPEN_ENDED,
                 useWit: false,
                 onResponse(input, witResponse) {
                    this.userData.name = input;
                    this.context.name = input;
                    return 'check_in';
                 }    
             }
         ],
         next: ''
     },
    check_in: {
        name: 'check_in',
        questions: [
            {
                name: 'feeling',
                //+ this.userData.name +
                prompt() { 
                    return 'Hey, '
                        + (this.userData.name)
                        + ' how are you feeling today?';
                },
                //prompt: 'Hey,' + this.context.name + ' how are you feeling today?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'check_in' };

                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const {mood} = witResponse.entities;
                        if (mood == null) {
                            return errorResponse;
                        }

                        const moodStr = mood[0].value;
                        if (moodStr == "negative") {
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
                        const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'check_in' };
                        const {issues} = witResponse.entities;
                        if (issues == null) {
                            return errorResponse;
                        }

                        for(var i = 0; i < issues.length; i++) {
                            const issueStr = issues[i].value;
                            if (issueStr == "exam") {
                                this.context.exams = "exams";
                                //console.log('ONE context.exams is ' + this.context.exams);
                            }
                            else if (issueStr == "course_material") {
                                this.context.courseMaterials = "course materials";
                                //console.log('TWOO context.materials is ' + this.context.courseMaterials);
                            }
                            else if (issueStr == "time_management") {
                                this.context.timeMan = "time managment";
                            }
                            else if (issueStr == "sleep") {
                                this.context.sleep = "sleeping";
                            }
                            else {
                            }
                            //console.log('issueStr is ' + issueStr);
                        }

                
                        if(this.context.exams != null) {return 'tempExam';}
                        if(this.context.courseMaterials != null) {return 'tempCourseMaterials';}
                        if(this.context.timeMan != null) {return 'tempTimeManagement';}
                        if(this.context.sleep != null) {return 'tempSleep';}

                        
/*
                        const issueStr = issues[0].value;
                        // first set the appropriate contexts
                        if (issueStr == "exam") {
                            this.context.exam = "exams";
                        }
                        else if (issueStr == "course_material") {
                            this.context.courseMaterials = "course materials";
                        }
                        else if (issueStr == "time_management") {
                            this.context.timeMan = "time managment";
                        }
                        else {
                        }

                        const issueStr2 = issues[1].value;
                        // first set the appropriate contexts
                        if (issueStr2 == "exam") {
                            this.context.exam = "exams";
                        }
                        else if (issueStr2 == "course_material") {
                            this.context.courseMaterials = "course materials";
                        }
                        else if (issueStr2 == "time_management") {
                            this.context.timeMan = "time managment";
                        }
                        else {
                        }
*/

/*
                        // now choose where to return to
                        if ((issueStr == "exam") || (issueStr2 == "exam")) {
                            return 'tempExam';
                        }
                        else if ((issueStr == "course_material") || (issueStr2 == "course_material")) {
                            return 'tempCourseMaterials';
                        }
                        else if ((issueStr == "time_management") || (issueStr2 == "time_management")) {
                            return 'tempTimeManagement';
                        }
                        else {
                            return 'contactCenter';
                        }
*/
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
    contactCenter: {
        name: 'contactCenter',
        questions: [
            {
                name: 'contact',
                prompt: 'I am sorry you feel this way, would you like to contact the counseling center? The number is 6 1 0 7 5 8 3 8 8 0.',
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
                prompt: 'Exams are naturally a stressful event. Good resources to consider are tutors and '
                + 'the center for academic success.',
                /*prompt: 'Test anxiety is a very common problem among students, so know that you\'re not alone. '
                + 'Good resources to consider when struggling with test anxiety or test performance are tutors and '
                + 'the center for academic success.'
                + 'Those resources will help you to manage your time and help you understand the material prior to your exams. ',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    if (this.context.courseMaterials == "course materials") {
                        return 'tempCourseMaterials'
                    }
                    else if (this.context.timeMan == "time managment") {
                        return 'tempTimeManagement';
                    }
                    else if (this.context.sleep == "sleeping") {
                        return 'tempSleep';
                    }
                    else {
                        return 'ending';              

                    }
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
                prompt: 'College courses are a challenge! Try to attend office hours and finding a group of classmates to study with.',
                /*prompt: 'Not understanding content is a common issue, the courses are supposed to be challenging. '
                + 'A few things that students find helpful when they don\'t understand material, are finding a tutor, '
                + 'attending office hours, and finding a group of classmates to study with.',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    if (this.context.timeMan == "time managment") {
                        return 'tempTimeManagement';
                    }
                    else if (this.context.sleep == "sleeping") {
                        return 'tempSleep';
                    }
                    else {
                        return 'ending';              
                    }
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
                prompt: 'Managing time well is one of the best skills a student can develop.'
                + ' try to '
                + ' create a planner for yourself and prioritize a list of things '
                + ' that you need to do.',
                /*prompt: 'Managing your time is one of the most difficult aspects of college. In order to keep track of '
                + ' everything you need to accomplish try to create a planner for yourself and prioritize a list of things '
                + ' that you need to do. Make the list as specific as possible.  Students often see that when you write everything'
                + ' that must be done down on paper, the list seems more manageable than it was in your head.',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    if (this.context.sleep == "sleeping") {
                        return 'tempSleep';
                    }
                    else {
                        //return 'check_in' 
                        return 'ending';       
                    }       
                }
            },
        ],
        next: null
    },

    tempSleep: {
        name: 'tempSleep',
        questions: [
            {
                name: 'sleep',
                prompt: 'Sleep is one of the most important parts of life. Before bed, try to relax in order to get the best sleep possible.',
                /*prompt: 'Managing your time is one of the most difficult aspects of college. In order to keep track of '
                + ' everything you need to accomplish try to create a planner for yourself and prioritize a list of things '
                + ' that you need to do. Make the list as specific as possible.  Students often see that when you write everything'
                + ' that must be done down on paper, the list seems more manageable than it was in your head.',*/
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    //return 'check_in' 
                    return 'ending'     ;              
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
                prompt() { 
                    var response = "";
                    if(this.context.exams != null) {response += this.context.exams + ' ';}
                    if(this.context.courseMaterials != null) {response += this.context.courseMaterials + ' ';}
                    if(this.context.timeMan != null) {response += this.context.timeMan + ' ';}
                    if(this.context.sleep != null) {response += this.context.sleep + ' ';}
                    return 'Thanks for sharing your current struggles with '
                        //+ (this.context.exam)  + ' and ' + (this.context.timeMan)
                        + response
                        + '. Next week we can check in on how those are going for you.';
                },
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: '' // TODO
    },
    __version__: '1',
};

module.exports = SECTIONS;