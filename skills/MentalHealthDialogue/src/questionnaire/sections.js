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
         //let {currentMood} = this.context;
         if (!name) {
             return 'firstTime';
         }
        
        return 'check_in';
    },

    firstTime: {
        name: 'firstTime',
        questions: [
            {
                name: 'getName',
                 prompt: 'Hi, I\'m your College Buddy. It\'s so nice to meet you. I\'m here to help you get through diffcult times, especially academic issues. I have been designed by college students just like you, who share similar struggles. First, what can I call you when speaking with you?',
                 type: SLOT_TYPES.OPEN_ENDED,
                 useWit: false,
                 onResponse(input, witResponse) {
                    this.userData.name = input;
                    this.context.name = input;
                    return 'moreInfo';
                 }    
             }
         ],
         next: ''
     },
    
    moreInfo: {
        name: 'moreInfo',
        questions: [
            {
                name: 'moreInfo',
                prompt() { 
                    return 'Hey, '
                        + (this.userData.name)
                        + ' Because this is the first time we are meeting, would you like to see more information about how I work?';
                },
                 type: SLOT_TYPES.YES_NO,
                 useWit: false,
                 onResponse(input, witResponse) {
                    if(input==='yes'){
                        return {
                            response: 'I\'m glad that you want to learn more. Essentially every time you want to talk to me, I\'ll ask you how you are feeling and try to make you feel better. '
                            + 'For example, if you said you are feeling stressed, I could help you put things into perspective and figure out what is causing you feel that way.'
                            + 'So let\'s give it a try, shall we?',
                        };
                    }
                    else{
                        return {
                            response: 'Okay, let\'s jump right in!',
                        };
                    }          
                 }    
             }
         ],
         next: 'check_in'
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
                        this.context.currentMood = input;
                        //console.log('mood is ', input);
                        
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
                prompt(){ 
                    return 'I\'m sorry you feel '+ (this.context.currentMood) +'. Can you tell me a little bit about what\'s going on?';
                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    console.log('context is ', this.context.currentMood);
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
                prompt: 'Ah, Exams. Even though exams seem so important, your entire future doesn\'t depend on them. Don\'t give a test the power to define you!',
                
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
                prompt: 'I never heard anyone say college is easy. Try to attend office hours and finding a group of classmates to study with.',
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
                prompt: 'Don\'t you wish there was more time in a day? That probably won\'t happen. '
                + ' Instead of putting things off until later and feeling guilty about it, try to start your work now. ',
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
                prompt: 'I know that sleep is super important to me too. Before bed, try to relax and imagine you are in your happy place, whether that\'s a beach, a hotel, a spa, or even F M L.',
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
                    var response = "It was a pleasure speaking with you today. ";
                    if(this.context.exams != null) {response += this.context.exams + ' ';}
                    if(this.context.courseMaterials != null) {response += this.context.courseMaterials + ' ';}
                    if(this.context.timeMan != null) {response += this.context.timeMan + ' ';}
                    if(this.context.sleep != null) {response += this.context.sleep + ' ';}
                    return 'Thanks for sharing your current struggles with '
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