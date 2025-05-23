import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-app.js"; import { getDatabase, ref, set, onValue, get, off, child, update, limitToLast, query, remove, onDisconnect} from "https://www.gstatic.com/firebasejs/9.0.1/firebase-database.js"; import { getAuth, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo  } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyAMfW_Qc7q1rlM-KJYKbUbc_zUqtZ24qNw",
    authDomain: "chat-d70bd.firebaseapp.com",
    projectId: "chat-d70bd",
    storageBucket: "chat-d70bd.firebasestorage.app",
    messagingSenderId: "421417324094",
    appId: "1:421417324094:web:5d0634747c1b5661d14b6f",
    measurementId: "G-P1HEZ14TS1"
  };
let start
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app);
let totalRooms = 0
let notificationAllowed

let settings = JSON.parse(localStorage.getItem("settings"))
function setup(){
    const previousHTML = document.body.innerHTML
    document.getElementById("chatArea").style.visibility = "hidden"
    document.getElementById("my-rooms").style.display = "none"
    document.getElementById("rooms").style.display = "none"
    document.getElementById("login").innerHTML = `
        <div id="sign-in">
            <button id = "signin">Sign in with google</button>
        </div>
    `
    const signin = document.getElementById("signin")
    async function login(){
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account' // Forces the account chooser dialog to show
        });      
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        ////console.log(user)
        if (user.email == "krupalt78@gmail.com"){
            localStorage.setItem("admin", true)
        }
        const userSettings = {
            profilePic: user.photoURL,
            displayName: user.displayName,
            uid:user.uid
        }
        settings = {}
        settings.profilePic = userSettings.profilePic
        settings.displayName = userSettings.displayName
        localStorage.setItem("settings", JSON.stringify(userSettings))
        document.getElementById("login").style.display = "none"
        document.getElementById("rooms").style.display = "flex"
        document.getElementById("my-rooms").style.display = "block"
        document.getElementById("chatArea").style.visibility = "hidden"
        window.location.reload()
    }
    signin.addEventListener("click", login)
}
try {
    Object.keys(settings)
} catch {
    setup()
}
let index = 0

set(ref(db, `users/${settings.uid}/displayName/`), settings.displayName)
set(ref(db, `users/${settings.uid}/profilePic`), settings.profilePic)

window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E'){
        e.preventDefault()
        if (localStorage.getItem("admin") == "true" || localStorage.getItem("admin") == true){
            const user = window.prompt("which one?")
            if (user == "school"){
                settings.mathActivitiesprofilePic = "https://lh3.googleusercontent.com/ogw/AF2bZyj2dHMsDhnJ8g2qKbGUkFnXYcR6lH-VE-S1pR__gh3UTxY=s64-c-mo"
            } else if (user == "admin"){
                settings.profilePic = "https://www.pngkey.com/png/full/263-2635979_admin-abuse.png"
                settings.displayName = "Admin"
            }
        }
    }
})

let previousRef = null
let previousOnline = null
let onlineNum
let partofmain = ""
let isOnMain = ""

function whichOne(id, main, part){
    // set listening location
    if (previousRef !== null){
        off(previousRef)
    }
    if (previousOnline !== null){
        off(ref(db, previousOnline))
        const good = previousOnline
        console.log(previousOnline)
        onValue(ref(db, good), (snapshot) => {
            const stuff = Object.values(snapshot.val())
            for (var i = 0; i < stuff.length; i++){
                if (stuff[i] == settings.uid){
                    remove(ref(db, `${good}/${i}`))
                }
            }
        }, {onlyOnce: true})
    }
    deletePersonOnline(`chat/${main ? "main": id}/online`)
    let limit = 50
    if (main){
        previousRef = query(ref(db, `chat/main/content/${part}`), limitToLast(limit))
    } else {
        previousRef = query(ref(db, `chat/${id}/content`), limitToLast(limit))
    }
    let location
    if (main){
        location = query(ref(db, `chat/main/content/${part}`), limitToLast(limit))
        previousOnline = `chat/main/online`
    }
    else {
        location = query(ref(db, `chat/${id}/content`), limitToLast(limit))
        previousOnline = `chat/${id}/online`
    }

    // people online
    document.getElementById("people-online").style.display = "flex"
    let peopleIndex
    
    if (main){
        onValue(ref(db, previousOnline), (snapshot) => {
            const val = snapshot.val()
            console.log(val)
            if (val == null) {
                set(ref(db, `chat/main/online/0`), settings.uid)
                peopleIndex = 0
            } else {
                const allvalues = Object.values(val)
                console.log(allvalues)
                let found = false
                document.getElementById("vow").innerHTML = ""
                for (let i = 0; i < allvalues.length; i++){
                    if (allvalues[i] == settings.uid){
                        found = true
                    }
                    const element = document.createElement("li")
                    onValue(ref(db, `users/${settings.uid}/displayName`), (snapshot) => {
                        element.textContent = `${snapshot.val()}`
                    }, {onlyOnce: true})
                    document.getElementById("vow").appendChild(element)
                }
                if (!found){
                    console.log("no found")
                    peopleIndex = allvalues.length
                    set(ref(db, `chat/main/online/${peopleIndex}`), settings.uid)
                }
                
                
            }
        })
    } else {
        onValue(ref(db, previousOnline), (snapshot) => {
            const val = snapshot.val()
            console.log(val)
            if (val == null) {
                set(ref(db, `chat/${id}/online/0`), settings.uid)
                peopleIndex = 0
            } else {
                const allvalues = Object.values(val)
                console.log(allvalues)
                let found = false
                document.getElementById("vow").innerHTML = ""
                for (let i = 0; i < allvalues.length; i++){
                    if (allvalues[i] == settings.uid){
                        found = true
                    }
                    const element = document.createElement("li")
                    onValue(ref(db, `users/${settings.uid}/displayName`), (snapshot) => {
                        element.textContent = `${snapshot.val()}`
                    }, {onlyOnce: true})
                    document.getElementById("vow").appendChild(element)
                }
                if (!found){
                    console.log("no found")
                    peopleIndex = allvalues.length
                    set(ref(db, `chat/${id}/online/${peopleIndex}`), settings.uid)
                }
                
                
            }
        })
    }
    // put messages
    onValue(location, (snapshot) => {
        const val = snapshot.val()
        
        if (val == null){
            if (main){
                set(ref(db, "chat/main/content/" + part), "")
            } else {
                set(ref(db, "chat/" + id + "/content"), "")
                onValue(ref(db, "rooms/"), (snapshot) => {
                    const val = snapshot.val()
                    const all = Object.values(val)
                    let found = false
                    for (var i = 0; i < all.length; i++){
                        if (all[i] == id){
                            found = true
                        }   
                    }
                    if (!found){
                        set(ref(db, `rooms/${all.length}`), id)
                    }
                }, {onlyOnce: true})
            }
        }
        const chatBox = document.getElementById("chatBox")
        chatBox.innerHTML = ""
        if (val == null){
            index = 0
            document.getElementById("login").style.display = "none"
            document.getElementById("rooms").style.display = "none"
            document.getElementById("chatArea").style.visibility = "visible"
        } else {
            //console.log(parseFloat(Object.keys(val).slice(-1)[0]) + 1)
            index = parseFloat(Object.keys(val).slice(-1)[0]) + 1
            const messages = Object.entries(val)
            //console.log(messages)
            messages.forEach(([key, valArray]) => {
                //////console.log(i, val[i])
                //console.log(index)
                const outer = document.createElement("div")
                outer.classList.add("message")
                const innerPic = document.createElement("img")
                onValue(ref(db, `users/${valArray[5]}/profilePic`), (snapshot) => {
                    innerPic.src = snapshot.val()
                }, {onlyOnce: true})
                innerPic.classList.add("profile-pic")
                innerPic.width = "30px"
                innerPic.alt = "pic"
                //referrerPolicy="no-referrer"
                innerPic.referrerPolicy = "no-referrer"
                const displayName = document.createElement("span")
                displayName.innerHTML = valArray[3]
                displayName.classList.add("displayName")
                const date = document.createElement("div")
                date.textContent = valArray[1]
                date.classList.add("date")
                const message = document.createElement("div")
                if (valArray[4] == true){
                    message.innerHTML = valArray[0]
                } else if (valArray[4] == false){
                    message.textContent = valArray[0]
                }
                chatBox.appendChild(outer)
                outer.appendChild(innerPic)
                outer.appendChild(displayName)
                outer.appendChild(date)
                outer.appendChild(message)
            })
            const lastMessage = Object.entries(val)[Object.keys(val).length - 1][1]
            //console.log(lastMessage)
            if (lastMessage[5] !== settings.uid){
                sendNotification(lastMessage[0], main ? `main/${part}`: `${id}`, lastMessage[3], "")
            }
            chatBox.scrollTop = chatBox.scrollHeight
            ////console.log("ok")
            document.getElementById("login").style.display = "none"
            document.getElementById("rooms").style.display = "none"
            document.getElementById("chatArea").style.visibility = "visible"
            
        }
    })
}

//join room
const joinArea = document.getElementById("joinRoom")
joinArea.style.display = "none"
const joinRoom = document.getElementById("join")
const joinButton = document.getElementById("joinbutton")
let randomCode = document.getElementById("roomid").value
joinRoom.addEventListener("click", () => {
    document.getElementById("createroom").style.display = "none"
    document.getElementById("online").textContent = randomCode
    isOnMain = false
    partofmain = ""
    joinRoom.style.display = "none"
    joinArea.style.display = "block"
})





joinButton.addEventListener("click", () => {
    onValue(ref(db, "rooms/"), (snapshot) => {
        const val = snapshot.val()
        const keys = val
        let found = false
        //console.log(document.getElementById("roomid").value)
        for (var i =0; i < Object.keys(keys).length; i++){
            //console.log(i)
            randomCode = document.getElementById("roomid").value
            //console.log(randomCode)
            if (randomCode == keys[i]){
                found = true
            }
        }
        //console.log("ee")
        if (found){
            document.getElementById("rooms").style.display = "none"
            if (randomCode == "main"){
                window.location.reload()
            }
            if (randomCode !== "main"){
                onValue(ref(db, `users/${settings.uid}/rooms`), (snapshot) => {
                    const val = snapshot.val()
                    if (val !== null){
                        let foundCode = false
                        for (var k = 0; k < Object.keys(val).length; k++){
                            if (val[k] == randomCode){
                                foundCode = true
                            }
                        }
                        if (!foundCode){
                            set(ref(db, `users/${settings.uid}/rooms/${Object.keys(val).length}`), randomCode)
                        }
                    }
                    else {
                        set(ref(db, `users/${settings.uid}/rooms/0`), randomCode)
                    }
                }, {onlyOnce: true})
            }
            document.getElementById("online").textContent = randomCode
            whichOne(document.getElementById("roomid").value, false, "")
            
        } else {
            alert(`Room id "${randomCode}" not found`)
        }
    }, {onlyOnce:true})
})

function back(){
    document.getElementById("createroom").style.display = "block"
    joinRoom.style.display = "block"
    joinArea.style.display = "none"
}

document.getElementById("wow").addEventListener("click", back)

// create room

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = getRandomInteger(0, characters.length - 1);
      code += characters.charAt(randomIndex);
    }
    return code;
}

const createRoom = document.getElementById("createroom")

createRoom.addEventListener("click", () => {
    randomCode = generateRandomCode(4)
    document.getElementById("online").textContent = randomCode
    let stuff
    onValue(ref(db, `users/${settings.uid}/rooms`), (snapshot) => {
        const val = snapshot.val()
        stuff =  Object.keys(val).length
        //console.log(stuff)
    }, {onlyOnce: true})
    let totalnomRooms
    onValue(ref(db, `rooms/`), (snapshot) => {
        const val = snapshot.val()
        //console.log(val)
        totalnomRooms = Object.keys(val)
        set(ref(db, `rooms/${totalnomRooms.length}`), randomCode)
        //console.log(totalnomRooms.length)
    }, {onlyOnce: true})
    set(ref(db, `users/${settings.uid}/rooms/${stuff}`), randomCode)
    document.getElementById("rooms").style.display = "none"
    document.getElementById("chatArea").style.display = "flex"
    whichOne(randomCode, false, "")
    ////console.log("click")
})

//set message and enter varialbes
const message = document.getElementById("message")
const send = document.getElementById("enter")


// files 
const fileInput = document.getElementById("upload")
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onloadend = () => {
    const base64String = reader.result
    writeData(randomCode, `<img src = "${base64String}" class = "chatPicture">`, true, isOnMain, partofmain)
  };

  reader.readAsDataURL(file);
});
// write data
message.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        writeData(randomCode, message.value, false, isOnMain, partofmain)
    }
})

send.addEventListener("click", () => {
    writeData(randomCode, message.value, false, isOnMain, partofmain)
})


function writeData(id, text, sendingAttachment, main, part){
    if (text.trim() == ""){
        return false
    } else {
        let location
        if (main){
            location = ref(db, `chat/main/content/${part}/${index++}`)
        } else {
            location = ref(db, `chat/${id}/content/${index++}`)
        }
        message.value = ""
        //console.log(index)
        const send = [text, `${new Date().toLocaleDateString('en-US', {month:"long", day:"numeric", year:"numeric"})} at ${new Date().toLocaleTimeString()}`, "", settings.displayName,  sendingAttachment, settings.uid]
        set(location, send)
    }
}

// shortcut to main room

const joinMainRoomButton = document.getElementById("joinMain")
joinMainRoomButton.addEventListener("click", () => {
    randomCode = "main"
    document.getElementById("navbar").style.display = "flex"
    partofmain = "general"
    whichOne(randomCode, true, "general")
    document.getElementById("rooms").style.display = "none"
})

// different channels of the main channel

const rules = document.getElementById("rules")
const general = document.getElementById("general")
const memes = document.getElementById("memes")
const school = document.getElementById("school")

rules.addEventListener("click", () => {
    randomCode = "main"
    if (localStorage.getItem("admin") == "true"){
        document.getElementById("message-container").style.display = "flex"
        document.getElementById("upload").style.display = "block"
    } else {
        document.getElementById("message-container").style.display = "none"
        document.getElementById("upload").style.display = "none"
    }
    partofmain = "rules"
    whichOne("main", true, "rules")
})

general.addEventListener("click", () => {
    randomCode = "main"
    document.getElementById("message-container").style.display = "flex"
    document.getElementById("upload").style.display = "block"
    partofmain = "general"
    whichOne("main", true, "general")
})

memes.addEventListener("click", () => {
    randomCode = "main"
    document.getElementById("message-container").style.display = "flex"
    document.getElementById("upload").style.display = "block"
    partofmain = "memes"
    whichOne("main", true, "memes")
})

school.addEventListener("click", () => {
    randomCode = "main"
    document.getElementById("message-container").style.display = "flex"
    document.getElementById("upload").style.display = "block"
    partofmain = "school"
    whichOne("main", true, "school")
})

window.setInterval(function(){
    if (randomCode == "main"){
        isOnMain = true
        document.getElementById("navbar").style.display = "flex"
        document.getElementById("online").textContent = `main/${partofmain}`
    } else {
        isOnMain = false
        document.getElementById("navbar").style.display = "none"
        document.getElementById("online").textContent = randomCode
    }
})

window.onload = function (){
 //   alert("rooms will be deleted everyday")
}

// saved rooms

onValue(ref(db, `users/${settings.uid}/rooms`), (snapshot) => {
    const val = snapshot.val()
    if (val == null){
        
    } else {
        const valKeys = Object.keys(val)
        totalRooms = valKeys.length
        document.getElementById("niceone").innerHTML = ""
        for (var i = 0; i < valKeys.length; i++){
            const newli = document.createElement("li")
            newli.textContent = val[i]
            document.getElementById("niceone").appendChild(newli)
        }
        const allli = document.querySelectorAll("#niceone li")
            allli.forEach(li => {
                li.addEventListener("click", () => {
                    randomCode = li.textContent
                    document.getElementById("online").textContent = randomCode
                    whichOne(randomCode, false, "")
                })
            })
        
    }
})


// sending notifications
let notifications
function askNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.")
      return;
    }
    Notification.requestPermission().then((permission) => {
      notifications = permission
      if (!permission){
        alert("Please enable notifications if you want to know if there are any new messages. We promise you will only receive notifications of the chat you are on")
      }
    });
}

askNotificationPermission()

function sendNotification(message, place, name, pic){
    if (notifications){
        if (document.visibilityState == "hidden"){
            const notification = new Notification(`New message from ${name} in room ${place}`, { body: message, icon: "icon.png", vibrate: [200, 100, 200], });
        }
    }
}

// online


// search for people
const searchPeople = document.getElementById("search-people")
const searchPlace = document.getElementById("vow")
searchPeople.addEventListener("input", () => {
    let allvow = Array.from(searchPlace.getElementsByTagName("li"))
    allvow.forEach(item => {
        if (item.textContent.toLowerCase().includes(searchPeople.value)){
            item.classList.remove("hide")
        } else {
            item.classList.add("hide")
        }
    })
})


// dlete person status

function deletePersonOnline(path) {
    const db = getDatabase();
    const dbRef = ref(db, path);

    get(dbRef).then((snapshot) => {
        if (!snapshot.exists()) {
            console.log("No data found at path:", path);
            return;
        }

        // Iterate over the actual key-value pairs in Firebase
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val() === settings.uid) {
                const newRef = ref(db, `${path}/${childSnapshot.key}`);

                // Ensure any previous onDisconnect() is canceled before setting a new one
                onDisconnect(newRef).cancel()
                    .then(() => {
                        console.log("Previous onDisconnect cancelled, setting new one.");
                        return onDisconnect(newRef).remove();
                    })
                    .then(() => console.log(`Data at ${path}/${childSnapshot.key} will be deleted on disconnect.`))
                    .catch((error) => console.error("Error updating onDisconnect:", error));

                return; // Stop looping once we find the correct value
            }
        });
    }).catch((error) => console.error("Error fetching data:", error));
}


