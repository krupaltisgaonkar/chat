import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-app.js"; import { getDatabase, ref, set, onValue, get, off, child, update} from "https://www.gstatic.com/firebasejs/9.0.1/firebase-database.js"; import { getAuth, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo  } from "https://www.gstatic.com/firebasejs/9.0.1/firebase-auth.js";



const firebaseConfig = {
    apiKey: "AIzaSyDw-7aUpZN0S5CzBOp1Q31xhiIO15J6qD8",
    authDomain: "chat-ee5e6.firebaseapp.com",
    projectId: "chat-ee5e6",
    storageBucket: "chat-ee5e6.firebasestorage.app",
    messagingSenderId: "9734116155",
    appId: "1:9734116155:web:2ce1f27d7485eab6ff1d1e",
    measurementId: "G-QM8FR4B1N0"
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
        //console.log(user)
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
let partofmain = ""
let isOnMain = ""

function whichOne(id, main, part){
    //console.log(id)
    if (previousRef !== null){
        off(previousRef)
    }
    if (main){
        previousRef = ref(db, `chat/main/content/${part}`)
    } else {
        previousRef = ref(db, `chat/${id}/content`)
    }
    let location
    if (main){
        location = ref(db, `chat/main/content/${part}`)
    }
    else {
        location = ref(db, `chat/${id}/content`)
    }
    onValue(location, (snapshot) => {
        const val = snapshot.val()
        if (val == null){
            if (main){
                set(ref(db, "chat/main/content/" + part), "")
            } else {
                set(ref(db, "chat/" + id + "/content"), "")
            }
            return false
        }
        //console.log(val)
        const chatBox = document.getElementById("chatBox")
        if (val == null){
            chatBox.innerHTML = ""
            index = 0
        } else {
            index = Object.keys(val).length
            chatBox.innerHTML = ""
            for (let i = 0; i < Object.keys(val).length; i++){
                ////console.log(i, val[i])
                const valArray = val[i]
                const outer = document.createElement("div")
                outer.classList.add("message")
                const innerPic = document.createElement("img")
                innerPic.src = valArray[2]
                innerPic.classList.add("profile-pic")
                innerPic.width = "30px"
                innerPic.alt = "pic"
                //referrerPolicy="no-referrer"
                innerPic.referrerPolicy = "no-referrer"
                const displayName = document.createElement("span")
                displayName.innerHTML = valArray[3]
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
            }
            const lastMessage = val[val.length - 1]
            if (lastMessage[5] !== settings.uid){
                sendNotification(lastMessage[0], main ? `main/${part}`: `${id}`, lastMessage[3], lastMessage[2] )
            }
            chatBox.scrollTop = chatBox.scrollHeight
            //console.log("ok")
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
    onValue(ref(db, "chat/"), (snapshot) => {
        const val = snapshot.val()
        const keys = Object.keys(val)
        let found = false
        for (var i =0; i < keys.length; i++){
            randomCode = document.getElementById("roomid").value
            //console.log(randomCode)
            if (randomCode == keys[i]){
                found = true
            }
        }
        if (found){
            document.getElementById("rooms").style.display = "none"
            if (randomCode == "main"){
                window.location.reload()
            }
            onValue(ref(db, `users/${settings.uid}/rooms`), (snapshot) => {
                const value = snapshot.val()
                if (value == null){
                    set(ref(db, `users/${settings.uid}/rooms/0`), document.getElementById("roomid").value)
                } else {
                    const valueKeys = Object.keys(value)
                    let foundroom = false
                    for (let i = 0; i < valueKeys.length; i++){
                        if (valueKeys[i] !== randomCode){
                            foundroom = true
                        } else {
                            
                        }
                    }
                    if (foundroom){
                        set(ref(db, `users/${settings.uid}/rooms/${valueKeys.length}`), randomCode)
                    }
                }
            }, {onlyOnce: true})
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
        console.log(stuff)
    }, {onlyOnce: true})
    set(ref(db, `users/${settings.uid}/rooms/${stuff}`), randomCode)
    whichOne(randomCode, false, "")
    //console.log("click")
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
        const send = [text, `${new Date().toLocaleDateString('en-US', {month:"long", day:"numeric", year:"numeric"})} at ${new Date().toLocaleTimeString()}`, settings.profilePic, settings.displayName,  sendingAttachment, settings.uid]
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
            const allli = document.querySelectorAll("#niceone li")
            allli.forEach(li => {
                li.addEventListener("click", () => {
                    randomCode = li.textContent
                    document.getElementById("online").textContent = randomCode
                    whichOne(randomCode, false, "")
                })
            })
        }
        
    }
})


// sending notifications
let notifications
function askNotificationPermission() {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.")
      return;
    }
    Notification.requestPermission().then((permission) => {
        alert("please enable notifications if you want to know if there are any new notifications")
      // set the button to shown or hidden, depending on what the user answers
      notifications = permission
    });
}

askNotificationPermission()

function sendNotification(message, place, name, pic){
    if (notifications){
        console.log(message, place, name, pic)
        if (document.visibilityState == "hidden"){
            const notification = new Notification(`New message from ${name} in room ${place}`, { body: message, icon: pic, vibrate: [200, 100, 200], });
        }
    }
}