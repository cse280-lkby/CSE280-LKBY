const SLOT_TYPES = require('./slot-types');

// function used to get random responses each time through conversation
function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

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
                    const errorResponse = { response: 'Well, I\'m here to make you feel better today, so let\'s get started. <break time="0.5s"/>', next: 'tempNegative' };
                    let resp = '';
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
                            resp += 'I\'m sorry you feel like that.'
                            return {response: resp, next: 'tempNegative'};
                            // add multiple responses to the negative catch
                            // then inside the tempNegative section, just have "Can you tell me a little more about what\'s going on?"
                            //return 'tempNegative';
                        }
                        else if (moodStr == "positive") {
                            resp += randomChoice([
                                'That\'s great that you\'re feeling '+ (this.context.currentMood) + ', have a nice rest of your day. Be sure to check back in tomorrow!',
                                'That\'s awesome, I\'m glad you\'re feeling ' + (this.context.currentMood) + ', keep that up and check back in soon!',
                                'Wow that\'s excellent! I\'m glad you\'re feeling ' + (this.context.currentMood) + '. Keep the good mood going, have a great rest of your day, and check back in soon!',
                                'Yay! I love it when you feel ' + (this.context.currentMood) + '. Go ahead and have a great rest of your day, don’t forget to check back in soon!'                    
                            ]);
                            return {response: resp, next: 'pos_ending'};
                        }
                        else {
                            return { response: 'Well, I\'m here to make you feel better today, so let\'s get started. <break time="0.5s"/>', next: 'tempNegative' };
                        }

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
                    //return 'I\'m sorry you feel '+ (this.context.currentMood) +'. Can you tell me a little bit about what\'s going on?';
                    //return 'I\'m sorry you feel like that. Can you tell me a little bit about what\'s going on?';
                    return 'Can you tell me a little bit about what\'s going on?';

                },
                type: SLOT_TYPES.OPEN_ENDED,
                useWit: true,
                onResponse(input, witResponse) {
                    console.log('context is ', this.context.currentMood);
                    if (witResponse != null) {
                        console.log('Got response from Wit API!', JSON.stringify(witResponse));
                        // have a generic response if none of the categories below are it, then move to breathing exercise
                        const errorResponse = { response: 'I appreciate you sharing that with me, and I can see how it could bring you down. Let me try to take your mind off of this.', next: 'breathing_exercise' };
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

                                resp += randomChoice([
                                    'Ah, Exams. Even though exams seem so important, your entire future doesn\'t depend on them. Don\'t give a test the power to define you! <break time="1s"/>',
                                    'I remember the first time I took an exam in college, I was incredibly nervous, but I did survive! So, you will too! Just try your best and you\'ll be happy.'                    
                                ]);
                                this.context.exams = "exams";
                            }
                            else if (issueStr == "course_material") {

                                resp += randomChoice([
                                    'I never heard anyone say college is easy. Try to attend office hours and find a group of classmates to study with. <break time="1s"/>',
                                    'Even though it may seem like everyone knows what they\'re doing, that\'s not true! Everyone struggles in different ways, but working together can help you learn even more.'                    
                                ]);

                                this.context.courseMaterials = "course materials";
                            }
                            else if (issueStr == "time_management") {
                                resp += randomChoice([
                                    'Don\'t you wish there was more time in a day? That probably won\'t happen. '
                                    + ' Instead of putting things off until later and feeling guilty about it, try to start your work now. <break time="1s"/> ',
                                    'Something I found useful when managing my time is making a list of what I need to accomplish. That way, you can get satisfaction of crossing something off when you finish!'                    
                                ]);
                                this.context.timeMan = "time managment";
                            }
                            else if (issueStr == "sleep") {
                                resp += randomChoice([
                                    'Something to help you sleep better at night is to set aside worry time during the day. Designate a short amount of time to think about the things dragging you down, just make sure it\'s not too close to bed time <break time="1s"/>',
                                    'Something to help you sleep better at night is to create a todo list of what you need to accomplish, that way tomorrow you will know the things you need to do and won\'t procrastinate <break time="1s"/>',
                                    'Something to help you sleep better at night is to have a buffer zone: take 15 minutes befor bedtime to maybe light a candle or take a bath to relax yourself'                                
                                ]);
                                this.context.sleep = "sleeping";
                            }
                            else if (issueStr == "career") {
                                resp += randomChoice([
                                    'Careers take time! Everyone\'s process takes a different amount of time. My advice to you is to be patient and take advantage of all the awesome opportunities' 
                                    + ' that the career center offers.  <break time="1s"/>'
                                ]);
                                this.context.career = "career";
                            }
                            else if (issueStr == "inferior") {
                                resp += randomChoice([
                                    'As Eleanor Roosevelt once said, No one can make you feel inferior without your consent. Believe in yourself, you\'re incredible! I mean look at you, you\'re at Lehigh University!  <break time="1s"/>',
                                    'Something I tell myself when I\'m feeling intimidated by others or not as confident is: <break time="0.5s"/> why not me? Why wouldn\'t I be the best. ',
                                    'Something that we often forget is that people are just people. The person or people that are making you feel lesser are the same as you, they have faults, fears, and insecurities too!'

                                ]);
                                this.context.inferior = "inferior";
                            }
                            else if (issueStr == "loneliness") {
                                resp += randomChoice([
                                    'Remember, loneliness is not a fact, it\'s just a feeling. The healthiest thing you can do to combat this feeling is to reach out and cultivate some friendships.   <break time="1s"/>',
                                    'If your attempts at finding friends seem like a dead end, don\'t give up, pursue other options. There are people out there looking for you to be friends with too! '

                                ]);
                                this.context.loneliness = "loneliness";
                            }
                            else if (issueStr == "partner_conflict") {
                                resp += randomChoice([
                                    'Ahh, partner work. That\'s never usually a conflict free time. Knowing that the situation isn\'t ideal, be sure to plan ahead and allow time for inefficiencies. <break time="1s"/>',
                                    'Communication is key: if you feel like you will be well received, talk it out with your partner. If that isn\'t an option, reach out to the professor, they are there to help with problems just like this! '
                                ]);
                                this.context.partner_conflict = "partner_conflict";
                            }
                            else {
                                resp += 'I appreciate you sharing that with me, and I can see how it could bring you down. Let me try to take your mind off of this.';
                            }
                        }
                        // return the response, jump to another question
                        return {response: resp, next: 'breathing_exercise'};
                    }
                }
            },
        ],
        next: 'breathing_exercise'
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
        next: 'check_in_post_breathing'
    },
    check_in_post_breathing: {
        name: 'check_in_post_breathing',
        questions: [
            {
                name: 'check_in_post_breathing',
                prompt: 'Would you like to continue this session with another activity?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        // if they want to try the activity, go to the actual activity
                        return 'gratitude_exercise';
                    }

                    else {
                        return 'ending';
                    }
                } 
            },
        ],
        next: 'ending'
    },
    gratitude_exercise: {
        name: 'gratitude_exercise',
        questions: [
            {
                name: 'gratitude_exercise',
                prompt: 'An activity I find that helps me deal with stress is thinking about the people or things I\'m grateful for. Would you like to try the gratitude exercise?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        // if they want to try the activity, go to the actual activity
                        return 'gratitude_exercise_part_2';
                    }

                    else {
                        return 'stretching_exercise';
                        /*
                        return {
                            response: 'That\'s alright, we\'ll give that a try another day! <break time="1s"/>',
                        };
                        */
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
                        const errorResponse = { response: 'A lot of people take that for granted. Being able to appreciate even the smallest things in your life can really improve your general level of happiness.', next: 'gratitude_exercise_part_2_secondQuestion' };
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
                                resp += 'It is so wonderful that there are people in this world who support you all the time, isn\'t it? You can always talk and share your worries with your friends. <break time="1s"/>';
                                this.context.friend = "friend";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "life_style") {
                                resp += 'Many people take those things for granted, it\'s great that you appreciate the things many others in the world cannot. <break time="1s"/>';
                                this.context.life_style = "life style";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "no") {
                                resp += 'I\'m sure there are great things happened to you but you just haven\'t noticed yet. Try to pay attention to even the smallest or simplest event, such as chat with a friend before class and have a good meal in a resturant.  <break time="1s"/>';
                                this.context.no = "no";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "health") {
                                resp += 'Your health is one of the most important things in the world. It\'s awesome that you realize the great things happening for your body. <break time="1s"/>';
                                this.context.health = "health";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "family") {
                                resp += 'No matter what obstacles you may face in life, your family is a constant that will always be there to help you through them. <break time="1s"/>';
                                this.context.family = "family";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "pet") {
                                resp += 'Aw, Pets! They\'re so cute It\'s so nice to have animals to calm you down and always love you back. <break time="1s"/>';
                                this.context.pet = "pet";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "education") {
                                resp += 'You are so lucky to have this opportunity to gain an education, it\'s amazing that you appreciate it too. Learning is a lifelong process! <break time="1s"/>';
                                this.context.education = "education";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "nature") {
                                resp += 'Most people take nature for granted, but the beauty of the outdoors is never ending! <break time="1s"/>';
                                this.context.nature = "nature";
                                return {response: resp};
                            }
                            else {
                                resp += 'A lot of people take that for granted. Being able to appreciate even the smallest things in your life can really improve your general level of happiness.';
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
                } 
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
                        const errorResponse = { response: 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                        + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                        + 'to make you feel just a little bit better. <break time="1s"/>', next: 'check_in_post_gratitude' };
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
                                resp += 'It is so wonderful that there are people in this world who support you all the time, isn\'t it? You can always talk and share your worries with your friends. <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.friend = "friend";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "life_style") {
                                resp += 'Many people take those things for granted, it\'s great that you appreciate the things many others in the world cannot. <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.life_style = "life style";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "no") {
                                resp += 'I\'m sure there are many more things happened to you but you just haven\'t noticed yet. Try to pay attention to even the smallest or simplest event, such as get in touch with someone you haven\'t talked for a while and watch an interesting Netflix show on your bed.  <break time="1s"/>';
                                resp += 'Let\'s try this gratitude exercise on another day and see if you can name at least two things! <break time="1s"/>';
                                this.context.no = "no";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "health") {
                                resp += 'Your health is one of the most important things in the world. It\'s awesome that you realize the great things happening for your body. <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.health = "health";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "family") {
                                resp += 'No matter what obstacles you may face in life, your family is a constant that will always be there to help you through them. <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.family = "family";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "pet") {
                                resp += 'Aw, Pets! They\'re so cute It\'s so nice to have animals to calm you down and always love you back. <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.pet = "pet";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "education") {
                                resp += 'You are so lucky to have this opportunity to gain an education, it\'s amazing that you appreciate it too. Learning is a lifelong process! <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.education = "education";
                                return {response: resp};
                            }
                            else if (gratitudeStr == "nature") {
                                resp += 'Most people take nature for granted, but the beauty of the outdoors is never ending! <break time="1s"/>';
                                resp += 'Don\'t you feel so much better knowing you have those great things in your life? <break time="1s"/>'
                                + 'The next time you feel down <break time=".25s"/> I challenge you to think of these positives, or even new ones, '
                                + 'to make you feel just a little bit better. <break time="1s"/>'
                                this.context.nature = "nature";
                                return {response: resp};
                            }
                            else {
                                resp += 'A lot of people take that for granted. Being able to appreciate even the smallest things in your life can really improve your general level of happiness.';
                            }
                        }

                        // return the response, jump to another question
                        return {response: resp};
                    }
                }
            },
        ],
        next: 'check_in_post_gratitude'
    },
    check_in_post_gratitude: {
        name: 'check_in_post_gratitude',
        questions: [
            {
                name: 'check_in_post_gratitude',
                prompt: 'Would you like to continue this session with another activity?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        // if they want to try the activity, go to the actual activity
                        return 'stretching_exercise';
                    }

                    else {
                        return 'ending';
                    }
                } 
            },
        ],
        next: 'ending'
    },
    stretching_exercise: {
        name: 'stretching_exercise',
        questions: [
            {
                name: 'stretching_exercise',
                prompt: 'A great way to relax and loosen up is stretching. Would you like to do some quick guided stretching?',
                type: SLOT_TYPES.YES_NO,
                onResponse(input) {
                    if(input==='yes'){
                        return {
                            response: 'Splendid! <break time="0.5s"/> The purpose of this exercise is to clear your mind by focusing on your body. You can do this exercise just sitting in your chair or laying down if you\'d like. <break time="0.5s"/>'
                        + ' Let\'s start by reaching your arms up. <break time="0.5s"/> Feel your muscles in your shoulder and along your ribs stretch. <break time="0.5s"/> 3 more seconds   <break time="3s"/> .'
                        + ' Now let\'s lower your arms outward so that they are now horizontal. Really extend out to the side and take deep breaths. Keep this position for 5 more seconds. <break time="5s"/> .'
                        + ' And now let\'s repeat that one more time. Go ahead and raise your arms back up so they are overhead again. Let\'s go for another 5 seconds. <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4 <break time="0.5s"/> 5 <break time="0.5s"/> .'
                        + ' And now lower your arms one final time. Hold them out to the side for 5 more seconds.  <break time="0.5s"/> 2 <break time="0.5s"/> 3 <break time="0.5s"/> 4 <break time="0.5s"/> 5.'
                        + ' <break time="1s"/> I hope this left you feeling a little more relaxed and loose. <break time="0.5s"/> I sure wish I could stretch like that. <break time="0.5s"/> '
                        + ' Whenver you feel tense, use these simple stretches to loosen your body and clear your mind. <break time="0.5s"/>',
                        };
                    }

                    else {
                        return {
                            response: 'Okay that\'s alright, we can stretch it all out another time! <break time="1s"/>',
                        };
                        
                    }
                } 
            },
        ],
        next: 'ending'
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
                    return 'It was a pleasure speaking with you today. Thanks for sharing your current struggles with me. <break time="0.5s"/>'
                        + '. Next time we can check in on how those are going for you. <break time="1s"/>'
                        + ' Please know that you can always talk to me, but the academic center is also a resource you can reach out to.';
                        
                },
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: '' // TODO
    },
    pos_ending: {
        name: 'pos_ending',
        questions: [
            {
                name: 'pos_ending',
                // TODO: Can this be customized to list *what the client likes about smoking*
                prompt() { 
                    return '';
                },
                type: SLOT_TYPES.OPEN_ENDED
            }
        ],
        next: '' // TODO
    },
    __version__: '1',
};

module.exports = SECTIONS;