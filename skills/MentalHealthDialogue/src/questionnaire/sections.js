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
                            + 'For example, if you said you are feeling stressed, I could help you put things into perspective and figure out what is causing you feel that way. '
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
        next: ''
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
                        const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'tempNegative' };
                        const {issues} = witResponse.entities;
                        if (issues == null) {
                            return errorResponse;
                        }

                        // declare a string that we will append the responses to
                        let resp = '';

                        for(var i = 0; i < issues.length; i++) {
                            const issueStr = issues[i].value;
                            if (issueStr == "exam") {
                                // inside of each of the possible matches, add to the returned string
                                resp += 'Ah, Exams. Even though exams seem so important, your entire future doesn\'t depend on them. Don\'t give a test the power to define you! <break time="1s"/>';

                                this.context.exams = "exams";
                            }
                            else if (issueStr == "course_material") {
                                resp += 'I never heard anyone say college is easy. Try to attend office hours and find a group of classmates to study with. <break time="1s"/>';

                                this.context.courseMaterials = "course materials";
                            }
                            else if (issueStr == "time_management") {
                                resp += 'Don\'t you wish there was more time in a day? That probably won\'t happen. '
                                + ' Instead of putting things off until later and feeling guilty about it, try to start your work now. <break time="1s"/> ';

                                this.context.timeMan = "time managment";
                            }
                            else if (issueStr == "sleep") {
                                resp += 'I know that sleep is super important to me too. Before bed, try to relax and imagine you are in your happy place, whether that\'s a beach, a hotel, a spa, or even F M L. <break time="1s"/>';

                                this.context.sleep = "sleeping";
                            }
                            else {
                            }
                        }
                        // return the response, jump to another question
                        return {response: resp};

                /*
                        if(this.context.exams != null) {return 'tempExam';}
                        if(this.context.courseMaterials != null) {return 'tempCourseMaterials';}
                        if(this.context.timeMan != null) {return 'tempTimeManagement';}
                        if(this.context.sleep != null) {return 'tempSleep';}
                */
                    }
                }
            },
        ],
        next: 'breathing_exercise'
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
                prompt: 'I\'m sorry you feel this way, would you like to contact the counseling center? The number is 6 1 0 7 5 8 3 8 8 0.',
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    return 'check_in'      ;              
                }
            },
        ],
        next: null
    },
    breathing_exercise: {
        name: 'breathing_exercise',
        questions: [
            {
                name: 'breathing_exercise',
                prompt: 'Something I have found to be helpful when dealing with stress is focussing on my breathing. Would you like to do a simple breathing exercise?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        return {
                            response: 'Awesome! The purpose of this exercise is to focus on your body and calm your mind with'
                        + ' the steadiness of your relaxed breathing. I will count to 4 as you breathe in and then I will count to 6 as you'
                        + ' slowly breathe out. Here we go  <break time="0.5s"/> .'
                        + ' Breathe in <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4.'
                        + ' And now out <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4 <break time="0.5s"/> 5 <break time="0.5s"/> 6 .'
                        + ' Now let\'s do that one more time, this time really feel your lungs fill with the air. <break time="0.5s"/>'
                        + ' Breathe in <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4.'
                        + ' And now slowly out <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4 <break time="0.5s"/> 5 <break time="0.5s"/> 6 .'
                        + '<break time="1s"/> I hope this helped you find some calm among the stress you\'re experiencing. I know I already feel more relaxed from it. <break time="1s"/>',
                        };
                    }

                    else {
                        return {
                            response: 'That\'s just fine, we can try that out a different day! <break time="1s"/>',
                        };
                    }
                } 
            },
        ],
        next: 'gratitude_exercise'
    },
    gratitude_exercise: {
        name: 'gratitude_exercise',
        questions: [
            {
                name: 'gratitude_exercise',
                prompt: 'Another activity I find that helps me deal with stress is thinking about the people or things I am grateful for. Would you like to try the gratitude exercise?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        // if they want to try the activity, go to the actual activity
                        return 'gratitude_exercise_part_2';
                    }

                    else {
                        return {
                            response: 'That\'s alright, we\'ll give that a try another day! <break time="1s"/>',
                        };
                    }
                } 
            },
        ],
        next: 'ending'
    },
    gratitude_exercise_part_2: {
        name: 'gratitude_exercise_part_2',
        questions: [
            {
                name: 'gratitude_exercise_part_2',
                prompt: 'Perfect! The purpose of this exercise is to remind you of the positives in your life, and take your mind away from all of the stress, and negatives that may be consuming you.'
                + '<break time="1s"/> For example, whenever I think of how grateful I am to be a healthy, speaking Alexa, I instantly feel better. Let\'s give it a try with you. <break time="1s"/>'
                + 'What is one thing you are grateful for today?',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'gratitude_exercise_part_2' };
                        const {gratitude} = witResponse.entities;
                        if (gratitude == null) {
                            return errorResponse;
                        }

                        // declare a string that we will append the responses to
                        let resp = '';

                        for(var i = 0; i < gratitude.length; i++) {
                            const gratitudeStr = gratitude[i].value;
                            if (gratitudeStr == "friend") {
                                // inside of each of the possible matches, add to the returned string
                                resp += 'It is so wonderful that there are people in this world who love you and support you all the time, isn\'t it? <break time="1s"/>';
                                this.context.friend = "friend";
                            }
                            else if (gratitudeStr == "life_style") {
                                resp += 'It is so wonderful that you have time to do the things you enjoy. Simple activities like what you did today can greatly improve life quality! <break time="1s"/>';
                                this.context.life_style = "life style";
                            }
                            else if (gratitudeStr == "no") {
                                resp += 'I\'m sure there are great things happened to you but you just haven\'t noticed yet. Try to pay attention to even the smallest or simplest event, such as chat with a friend before class and have a good meal in a resturant.  <break time="1s"/>';
                                this.context.no = "no";
                            }
                            else {
                            }
                        }
                        
                        // return the response, jump to another question
                        return {response: resp};
                    }
                }
                /*onResponse(input) {
                        return {
                            response: 'Don\'t you feel so much better knowing you have those 2 great things in your life? <break time="1s"/>'
                            + 'The next time you feel down <break time=".25s"/> I challenge you to think of these 2 positives, or even new ones, '
                            + 'to make you feel just a little bit better. <break time="1s"/>',
                        };
                } */
            },
        ],
        next: 'gratitude_exercise_part_2_secondQuestion'
    },


    gratitude_exercise_part_2_secondQuestion: {
        name: 'gratitude_exercise_part_2_secondQuestion',
        questions: [
            {
                name: 'gratitude_exercise_part_2_secondQuestion',
                prompt: 'Now, one more time. Can you think of another thing you are grateful for today? What is it? ',
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        const errorResponse = { response: 'Sorry, I didn\'t understand that.', next: 'gratitude_exercise_part_2_secondQuestion' };
                        const {gratitude} = witResponse.entities;
                        if (gratitude == null) {
                            return errorResponse;
                        }

                        // declare a string that we will append the responses to
                        let resp = '';

                        for(var i = 0; i < gratitude.length; i++) {
                            const gratitudeStr = gratitude[i].value;
                            if (gratitudeStr == "friend") {
                                // inside of each of the possible matches, add to the returned string
                                resp += 'It is so wonderful that there are people in this world who love you and support you all the time, isn\'t it? <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.friend = "friend";
                            }
                            else if (gratitudeStr == "life_style") {
                                resp += 'It is so wonderful that you have time to do the things you enjoy. Simple activities like what you did today can greatly improve life quality! <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.life_style = "life style";
                            }
                            else if (gratitudeStr == "no") {
                                resp += 'I\'m sure there are many more things happened to you but you just haven\'t noticed yet. Try to pay attention to even the smallest or simplest event, such as get in touch with someone you haven\'t talked for a while and watch an interesting Netflix show on your bed.  <break time="1s"/>';
                                resp += 'Let\'s try this gratitude exercise on another day and see if you can name at least two things! <break time="1s"/>';
                                this.context.no = "no";
                            }
                            else {
                            }
                        }
    
                        // return the response, jump to another question
                        return {response: resp};
                    }
                }
            },
        ],
        next: 'ending'
    },


    /*
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
    */
   /*
    tempCourseMaterials: {
        name: 'tempCourseMaterials',
        questions: [
            {
                name: 'course_materials',
                prompt: 'I never heard anyone say college is easy. Try to attend office hours and finding a group of classmates to study with.',
                //prompt: 'Not understanding content is a common issue, the courses are supposed to be challenging. '
                //+ 'A few things that students find helpful when they don\'t understand material, are finding a tutor, '
                //+ 'attending office hours, and finding a group of classmates to study with.',
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
    */
   /*
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
    */
    /*
    tempSleep: {
        name: 'tempSleep',
        questions: [
            {
                name: 'sleep',
                prompt: 'I know that sleep is super important to me too. Before bed, try to relax and imagine you are in your happy place, whether that\'s a beach, a hotel, a spa, or even F M L.',
                type: SLOT_TYPES.OPEN_ENDED,
                onResponse(input) {
                    //return 'check_in' 
                    return 'ending'     ;              
                }
            },
        ],
        next: null
    },
    */

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
                    return 'It was a pleasure speaking with you today. Thanks for sharing your current struggles with '
                        + response
                        + '. Next time we can check in on how those are going for you.';
                },
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: '' // TODO
    },
    __version__: '1',
};

module.exports = SECTIONS;