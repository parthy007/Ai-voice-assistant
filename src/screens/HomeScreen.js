import React, { useEffect, useRef, useState } from 'react'
import { View, Text, SafeAreaView, Image, ScrollView, TouchableOpacity, Alert } from 'react-native'
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import Features from '../components/features';
import Voice from '@react-native-community/voice';
import { apiCall } from '../api/openAI.js';
import Tts from 'react-native-tts';


export default function HomeScreen () {
  const [messages,setMessages] = useState([])
  const [recording,setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollViewRef = useRef();

  useEffect(() => {
    if (result.trim().length > 0) {
      const newMessages = [...messages];
      newMessages.push({ role: 'user', content: result.trim() });
      setMessages(newMessages);
      setLoading(true);
      updateScrollView();
      apiCall(result.trim(), newMessages).then(res => {
        if(res.success){
          setMessages([...res.data]);
          setLoading(false);
          updateScrollView();
          setResult('');
          startTextToSpeech(res.data[res.data.length-1]);
        }else{
          Alert.alert("Error: ",res.msg);
        }
      });
    }
  }, [result]); 

  const startTextToSpeech = (message) =>{
    if(!message.content.includes('https')){
      setSpeaking(true);
      Tts.speak(message.content, {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 0.5,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      });
    }
  }

  const updateScrollView = () =>{
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({animated: true})
    }, 200);
  }

  const clear = () =>{
    setMessages([]);
    Tts.stop();
  }

  const stopSpeaking = () =>{
    Tts.stop();
    setSpeaking(false);
  }

  const speechStartHandler = (e) =>{
    console.log("Speech Start Handler");
  }
  const speechEndHandler = (e) =>{
    setRecording(false)
    console.log("Speech End Handler");
  }
  const speechResultsHandler = (e) =>{
    console.log("Voice event: ",e);
    const text = e.value[0];
    setResult(text);
  }
  const speechErrorHandler = (e) =>{
    console.log("speech error handler: ",e);
  }

  const startRecording = async() =>{
    setRecording(true);
    Tts.stop();
    try{
      await Voice.start('en-GB')
    }catch(err){
      console.log("Error while starting, ", err)
    }
  }
  const stopRecording = async() =>{
    try{
      await Voice.stop()
      setRecording(false)
    }catch(err){
      console.log("Error while stopping, ", err)
    }
  }

  useEffect(()=>{
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechResults = speechResultsHandler;
    Voice.onSpeechError = speechErrorHandler;

    //tts event listners
    Tts.addEventListener('tts-start', (event) => console.log("start", event));
    Tts.addEventListener('tts-progress', (event) => console.log("progress", event));
    Tts.addEventListener('tts-finish', (event) => console.log("finish", event));
    Tts.addEventListener('tts-cancel', (event) => console.log("cancel", event));

    return ()=>{
      Voice.destroy().then(Voice.removeAllListeners);
    }
  },[])
  
  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 flex mx-5">
        <View className="flex-row justify-center">
          <Image source={require("../assests/bot.png")} style={{width:hp(15),height:hp(15)}}/>
        </View>


        {messages.length > 0 ? (
          <View className="flex-1 space-y-2">
            <Text style={{fontSize:wp(5)}} className="text-gray-700 font-semibold ml-1">
              Assistant
            </Text>
            <View style={{height:hp(58)}} className="bg-neutral-200 rounded-3xl p-4">
              <ScrollView className="space-y-4" ref={scrollViewRef}>
                {messages.map((message,index)=>{
                  if(message.role==="assistant"){
                    if(message.content.includes("https")){
                      return(
                        <View key={index} className="flex-row justify-start">
                          <View className="bg-emerald-200 p-2 flex rounded-2xl rounded-tl-none">
                            <Image 
                              source={{uri:message.content}}
                              resizeMode='contain'
                              className="rounded-2xl"
                              style={{height:wp(60),width:wp(60)}}
                            />
                          </View>
                        </View>
                      )
                    }else{
                      return(
                        <View key={index} className="flex-row justify-start">
                          <View className="bg-emerald-200 rounded-xl p-2 rounded-tl-none" style={{width:wp(70)}}>
                            <Text className="text-gray-700">
                              {message.content}
                            </Text>
                          </View>
                        </View>
                      )
                    }
                  }
                  else{
                    return(
                      <View key={index} className="flex-row justify-end">
                        <View className="bg-white rounded-xl p-2 rounded-tr-none" style={{width:wp(70)}}>
                          <Text className="text-gray-700">
                            {message.content}
                          </Text>
                        </View>
                      </View>
                    )
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ):(
          <Features/>
        )}
        <View className="flex-row justify-center items-center">
          {loading ? (
            <Image 
              source={require("../assests/loading.gif")}
              style={{width:hp(10),height:hp(10)}}
            />
          ):(

            recording ? (
              <TouchableOpacity onPress={stopRecording}>
                <Image 
                  source={require("../assests/voiceLoading.gif")}
                  className="rounded-full"
                  style={{width:hp(10),height:hp(10)}}
                />
              </TouchableOpacity>
            ):(
              <TouchableOpacity onPress={startRecording}>
                <Image 
                  source={require("../assests/recordingIcon.png")}
                  className="rounded-full"
                  style={{width:hp(10),height:hp(10)}}
                />
              </TouchableOpacity>
            )
          )}

          {speaking && messages.length>0 && (
            <TouchableOpacity onPress={stopSpeaking} className="bg-red-400 p-3 rounded-3xl absolute left-10">
              <Text className="text-white font-semibold">Stop</Text>
            </TouchableOpacity>
          )}

          {messages.length>0 && (
            <TouchableOpacity onPress={clear} className="bg-neutral-400 p-3 rounded-3xl absolute right-10">
              <Text className="text-white font-semibold">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}
