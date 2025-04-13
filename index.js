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
        const userSettings = {
            profilePic: user.photoURL,
            displayName: user.displayName,
            uid:user.uid,
            email: user.email
        }
        settings = {}
        settings = userSettings
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
    if (settings.email == null){
        localStorage.clear()
        alert("This application is out of date. We will reload the page and you will have to sign in again.")
        window.location.reload()
    }
} catch {
    setup()
}
let index = 0

set(ref(db, `users/${settings.uid}/displayName/`), settings.displayName)
set(ref(db, `users/${settings.uid}/profilePic`), settings.profilePic)
set(ref(db, `users/${settings.uid}/email`), settings.email)


// search for admins
onValue(ref(db, `admins/`), (snapshot) => {
    const val = snapshot.val()
    console.log(val)
    if (val !== null){ 
        const allEmails = Object.values(val)
        allEmails.forEach(email => {
            if (email == settings.email){
                console.log("is admin")
                localStorage.setItem("admin", true)
                document.getElementById("admin-help").style.display = "block"
            }
        })
    } else {
        return false
    }
}, {onlyOnce: true})

window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E'){
        e.preventDefault()
        if (localStorage.getItem("admin") == "true" || localStorage.getItem("admin") == true){
            const user = window.prompt("which one?")
            if (user == "normal"){
                settings.displayName = localStorage.getItem("settings").displayName
                settings.profilePic = localStorage.getItem("settings").profilePic
            } else if (user == "admin"){
                settings.profilePic = "https://www.pngkey.com/png/full/263-2635979_admin-abuse.png"
                settings.displayName = "Admin"
                alert("You are now an admin!")
            }
        }
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'H'){
        e.preventDefault()
        if (localStorage.getItem("admin") == "true" || localStorage.getItem("admin") == true) alert("Admin help section:\nctrl + shift + e: switch to admin role.\nType 'admin' for admin name and profile pic. Type 'normal' for ur normal profile pic and name.\n\n\nctrl + shift + a: add a new admin")
    }
    if (e.ctrlKey && e.shiftKey && e.key == "A"){
        e.preventDefault()
        if (localStorage.getItem("admin") == true || localStorage.getItem("admin") == "true"){
            const addadmin = prompt("Type the email of the admin you want to add.")
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (pattern.test(addadmin)){
                onValue(ref(db, `admins`), (snapshot) => {
                    const val = snapshot.val()
                    if (val == null){
                        set(ref(db, `admins/0`), addadmin)
                        alert(`${addadmin} is now an admin.`)
                    } else {
                        const valKeys = Object.keys(val)
                        set(ref(db, `admins/${valKeys.length}`), addadmin)
                        alert(`${addadmin} is now an admin.`)
                    }
                }, {onlyOnce: true})
            } else {
                alert("plz provide a complete and valid email.")
            }
        }
    }
})

let previousRef = null
let previousOnline = null
let onlineNum
let partofmain = ""
let isOnMain = ""

function roomNameGenerator(){
    const words = ["Funk", "Sigma", "Rizzler", "Apex", "Silly", "Gorilla", "Yass", "Slay", "Queen", "Rizzy", "Word", "Elephant", "Slow", "Sloth", "Monkey", "Black", "White", "Yellow", "Red", "T-rex", "Bob", "Boom"]
    let word = ""
    for (let i = 0; i < 3; i++){
        const randomIndex = Math.floor(Math.random() * words.length);
        word += words[randomIndex]
    }
    return word
}

function whichOne(id, main, part){
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
            const messageKey = Object.keys(val)
            //console.log(messages)
            for (let i = 0; i < messages.length; i++){
                const valArray = messages[i][1]
                //console.log(index)
                const outer = document.createElement("div")
                outer.classList.add("message")
                const innerPic = document.createElement("img")
                innerPic.src = valArray[valArray.length - 1]
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
                if (localStorage.getItem("admin")){
                    const adminOptions = document.createElement("div")
                    adminOptions.classList.add("admin-options")
                    adminOptions.id = messageKey[i]

                    const edit = document.createElement("div")
                    edit.textContent = "✏️"
                    edit.classList.add("edit")
                    edit.title = "Edit this message"

                    const remove = document.createElement("div")
                    remove.textContent = "🗑️"
                    remove.classList.add("remove")
                    remove.title = "Delete this message"

                    const ban = document.createElement("div")
                    ban.textContent = "🚫"
                    ban.classList.add("ban")
                    ban.title = "Ban this person"

                    outer.appendChild(adminOptions)
                    adminOptions.appendChild(edit)
                    adminOptions.appendChild(remove)
                    adminOptions.appendChild(ban)
                }
                outer.appendChild(date)
                outer.appendChild(message)
            }
            const lastMessage = Object.entries(val)[Object.keys(val).length - 1][1]
            if (localStorage.getItem("admin")){
                const edits = document.querySelectorAll(".admin-options .edit")
                edits.forEach(edit => {
                    edit.addEventListener("click", () => {
                        const promptAns = window.prompt("What would you like to change it to?")
                        if (promptAns.trim() == ""){
                            return false
                        } else {
                            set(ref(db, main ? `chat/main/content/${part}/${edit.parentElement.id}/0` : `chat/${id}/content/${edit.parentElement.id}/0`), promptAns)
                        }

                    })
                })

                const remove = document.querySelectorAll(".admin-options .remove")
                remove.forEach(remove => {
                    remove.addEventListener("click", () => {
                        const confirm = window.confirm("Do you want to delete this message?")
                        if (confirm){
                            set(ref(db, main ? `chat/main/content/${part}/${remove.parentElement.id}/0` : `chat/${id}/content/${remove.parentElement.id}/0`), `<em>This message was deleted by an admin.</em>`)
                            set(ref(db, main ? `chat/main/content/${part}/${remove.parentElement.id}/4` : `chat/${id}/content/${remove.parentElement.id}/4`), true)
                        } else {
                            return false
                        }

                    })
                })

                const bans = document.querySelectorAll(".admin-options .ban")
                bans.forEach(ban => {
                    ban.addEventListener("click", () => {
                        onValue(ref(db, main ? `chat/main/ban` : `chat/${id}/ban`), (snapshot) => {
                            const vow = snapshot.val()
                            let banList
                            if (vow == null) banList = ""; else banList = Object.keys(vow)
                            let banId = ""
                            // get user id
                            onValue(ref(db, main ? `chat/main/content/${part}/${ban.parentElement.id}/5` : `chat/${id}/content/${ban.parentElement.id}/5`), (snapshot) => {
                                const snap = snapshot.val()
                                banId = snap
                                let found = false
                                let banningSelf = false
                                onValue(ref(db, main ? `chat/main/content/${part}/${ban.parentElement.id}/5` : `chat/${id}/content/${ban.parentElement.id}/5`), (snapshot) => {
                                    const userBan = snapshot.val()
                                    if (userBan == settings.uid){
                                        alert("you can't ban ur self")
                                        banningSelf = true
                                    }
                                }, {onlyOnce: true})
                                
                                if (banningSelf){
                                    return false
                                } else {
                                    for (let k = 0; k < banList.length; k++){
                                        if (banId == banList[k]){
                                            found = true
                                        }
                                    }
                                    if (!found){
                                        const confirmBan = confirm(`Ban this account?`)
                                        if (confirmBan){
                                            set(ref(db, main ? `chat/main/ban/${banId}` : `chat/${id}/ban/${banId}`), true)
                                        }
                                    } else {
                                        const confirmBan = confirm("Let this person back into this chat?")
                                        if (confirmBan){
                                            set(ref(db, main ? `chat/main/ban/${banId}` : `chat/${id}/ban/${banId}`), null)
                                        }
                                    }
                                }
                            }, {onlyOnce: true})
                        }, {onlyOnce: true})
                            
                    })
                })
            }
            //console.log(lastMessage)
            if (lastMessage[5] !== settings.uid){
                sendNotification(lastMessage[0], main ? `main/${part}`: `${id}`, lastMessage[3], "")
            }
            chatBox.scrollTop = chatBox.scrollHeight + 10
            ////console.log("ok")
            document.getElementById("login").style.display = "none"
            document.getElementById("rooms").style.display = "none"
            document.getElementById("chatArea").style.visibility = "visible"
            
        }
    })
}

document.addEventListener("scroll", () => {
    console.log("scroll")
})

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
            onValue(ref(db, `chat/${randomCode}/ban`), (snapshot) => {
                const banList = snapshot.val() == null ? "" : Object.keys(snapshot.val())
                if (banList.includes(settings.uid)){
                    alert("you are banned from this chat")
                    window.location.reload()
                }
            }, {onlyOnce: true})
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
            onValue(ref(db, `chat/${randomCode}/nickname`), (snapshot) => {
                const value = snapshot.val()
                if (value == null){
                    set(ref(db, `chat/${randomCode}/nickname`), roomNameGenerator())
                } else {
                    document.getElementById("roomName").value = value
                }
            })
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

document.getElementById("roomName").addEventListener("input", () => {
    set(ref(db, `chat/${randomCode}/nickname`), document.getElementById("roomName").value)
})

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
    onValue(ref(db, `chat/${randomCode}/nickname`), (snapshot) => {
        const value = snapshot.val()
        if (value == null){
            roomNameGenerator(`chat/${randomCode}`)
        } else {
            document.getElementById("roomName").value = value
        }
    })
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
        const send = [text, `${new Date().toLocaleDateString('en-US', {month:"long", day:"numeric", year:"numeric"})} at ${new Date().toLocaleTimeString()}`, "", settings.displayName,  sendingAttachment, settings.uid, settings.profilePic]
        set(location, send)
    }
}

// shortcut to main room

const joinMainRoomButton = document.getElementById("joinMain")
joinMainRoomButton.addEventListener("click", () => {
    randomCode = "main"
    document.getElementById("navbar").style.display = "flex"
    partofmain = "general"
    onValue(ref(db, `chat/${randomCode}/ban`), (snapshot) => {
        const banList = snapshot.val() == null ? "" : Object.keys(snapshot.val())
        if (banList.includes(settings.uid)){
            alert("you are banned from this chat")
            window.location.reload()
        }
    }, {onlyOnce: true})
    whichOne(randomCode, true, "general")
    document.getElementById("rooms").style.display = "none"
    document.getElementById("roomNameDiv").style.display = "none"
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
        let allli = document.querySelectorAll(".easypickings")
        for (var i = 0; i < valKeys.length; i++){
            const newli = document.createElement("li")
            const easy = val[i]
            onValue(ref(db, `chat/${val[i]}/nickname`), (snapshot) => {
                const value = snapshot.val()
                if (value == null){
                    const vow =  roomNameGenerator()
                    set(ref(db, `chat/${easy}/nickname`), vow)
                    newli.textContent = vow
                } else {
                    newli.textContent = value
                }
                newli.id = easy
                let colors = ["red", "rgb(0, 255, 0)", "orange", "rgb(9, 149, 243)", "rgb(220, 9, 243)", "rgb(243, 224, 9)", "rgb(255, 255, 255)", "rgb(158, 216, 255)", "rgb(9, 243, 149)"]
                newli.style.color = colors[Math.floor(Math.random() * colors.length)];
                newli.classList.add("easypickings")
                document.getElementById("niceone").appendChild(newli)
                allli = document.querySelectorAll("#niceone li")
                allli.forEach(li => {
                    //console.log(li.id)
                    li.addEventListener("click", () => {
                        //console.log("hi")
                        randomCode = li.id
                        document.getElementById("roomNameDiv").style.display = "flex"
                        document.getElementById("roomName").value = li.textContent
                        document.getElementById("online").textContent = randomCode
                        onValue(ref(db, `chat/${randomCode}/ban`), (snapshot) => {
                            const banList = snapshot.val() == null ? "" : Object.keys(snapshot.val())
                            if (banList.includes(settings.uid)){
                                alert("you are banned from this chat")
                                window.location.reload()
                            }
                        }, {onlyOnce: true})
                        whichOne(randomCode, false, "")
                    })
                })
                console.log("f")
            })
        }
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