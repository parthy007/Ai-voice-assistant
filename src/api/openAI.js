import {apiKey} from "../constants/index"
import axios from "axios"

const client = axios.create({
    headers:{
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey 
    }
})

const chatGptEndpoint = "https://api.openai.com/v1/chat/completions"
const dalleEndpoint = "https://api.openai.com/v1/images/generations"

export const apiCall = async(prompt,messages) =>{
    try {
        const res = await client.post(chatGptEndpoint,{
            model: "gpt-3.5-turbo",
            messages:[
                {
                    role: 'user',
                    content: `Does this message wants to generate an AI picture, image, art or anything similar? ${prompt}. Simply answer in yes or no`
                }
            ]
        })

        let isArt = res.data?.choices[0]?.message.content;
        if(isArt.toLowerCase().includes('yes')){
            console.log('Dalle API')
            return dalleApiCall(prompt, messages || [])
        }else{
            console.log("ChatGpt API")
            return chatgptApiCall(prompt, messages || [])
        }
    } catch (error) {
        console.log('error ',error)
        Promise.resolve({success:false, msg: error.message})
    }
}

const chatgptApiCall = async (prompt, messages)=>{
    try{
        const formattedMessages = [
            {
                role: 'user',
                content: prompt
            },
            ...messages
        ];
        const res = await client.post(chatGptEndpoint, {
            model: "gpt-3.5-turbo",
            messages: formattedMessages
        })

        let answer = res.data?.choices[0]?.message?.content;
        messages.push({role: 'assistant', content: answer.trim()});
        return Promise.resolve({success: true, data: messages}); 

    }catch(error){
        console.log('error: ',error);
        Promise.resolve({success:false,msg: error.message})
    }
}

const dalleApiCall = async(prompt,messages)=>{
    try {
        const res = await client.post(dalleEndpoint,{
            prompt,
            n: 1,
            size: "512x512"
        })
        let url = res?.data?.data[0]?.url;
        messages.push({role:'assistant', content: url});
        return Promise.resolve({success: true, data: messages})
    } catch (error) {
        console.log('error ',error);
        Promise.resolve({success:false,msg: error.message})
    }
}