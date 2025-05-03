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
    document.getElementById("my-profile-tab").style.display = "none"
    document.getElementById("my-friend-requests-tab").style.display = "none"
    document.getElementById("my-friends-container").style.display = "none"
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
            email: user.email,
        }
        settings = {}
        settings = userSettings
        localStorage.setItem("settings", JSON.stringify(userSettings))
        document.getElementById("login").style.display = "none"
        document.getElementById("my-friends-container").style.display = "flex"
        document.getElementById("my-friend-requests-tab").style.display = "flex"
        document.getElementById("rooms").style.display = "flex"
        document.getElementById("my-rooms").style.display = "block"
        document.getElementById("chatArea").style.visibility = "hidden"
        document.getElementById("my-profile-tab").style.display = "flex"
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
    set(ref(db, `users/${settings.uid}/displayName/`), settings.displayName)
    set(ref(db, `users/${settings.uid}/profilePic`), settings.profilePic)
    set(ref(db, `users/${settings.uid}/email`), settings.email)
} catch {
    setup()
}
let index = 0
async function setUpUserProfile (){
    // set my profile
    const profilePic = settings.profilePic
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = "no-referrer"
    img.src = profilePic;
    // The magic begins after the image is successfully loaded
    img.onload = async function () {
        console.log("eee")
        var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
                
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx.drawImage(img, 0, 0);
                
        // Unfortunately, we cannot keep the original image type, so all images will be converted to PNG
        // For this reason, we cannot get the original Base64 string
        var uri = canvas.toDataURL('image/jpg'),
        b64 = uri.replace(/^data:image\/jpg;base64,/, "");
        document.getElementById("my-profile-pic").style.backgroundImage = `url(${b64})`
        document.getElementById("my-profile-tab").style.backgroundImage = `url(${b64})`

        var blockSize = 5, // only visit every 5 pixels
        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;
        if (!context) {
            return defaultRGB;
        }

        height = canvas.height = img.naturalHeight || img.offsetHeight || img.height;
        width = canvas.width = img.naturalWidth || img.offsetWidth || img.width;

        context.drawImage(img, 0, 0);

        try {
                data = context.getImageData(0, 0, width, height);
        } catch(e) {
            /* security error, img on diff domain */
            return defaultRGB;
        }

        length = data.data.length;

        while ( (i += blockSize * 4) < length ) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i+1];
            rgb.b += data.data[i+2];
        }

        // ~~ used to floor values
        rgb.r = ~~(rgb.r/count);
        rgb.g = ~~(rgb.g/count);
        rgb.b = ~~(rgb.b/count);
        console.log(rgb)
        let dominantColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        /* const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
        const colorCounts = {};
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const color = `rgb(${r},${g},${b})`;
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
        let dominantColor;
        let maxCount = 100;
        console.log(colorCounts)
        for (const color in colorCounts) {
        if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            console.log(maxCount)
            dominantColor = color;
        }*/
        document.getElementById("my-profile-background").style.backgroundColor = dominantColor
    }
    // set my profile name
    const displayName = await get(ref(db, `users/${settings.uid}/displayName`))
    console.log(displayName.val())
    document.getElementById("my-profile-displayname").textContent = displayName.val()
    const nickname = await get(ref(db, `users/${settings.uid}/nickname`))
    if (nickname.val() == null){
        
    } else {
        document.getElementById("my-profile-nickname").value = nickname.val()
    }
    document.getElementById("link").textContent = `https://krupaltisgaonkar.github.io/chat/?addFriend=${btoa(settings.uid)}`
    
}
setUpUserProfile()

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
        if (localStorage.getItem("admin") == "true" || localStorage.getItem("admin") == true) alert("Admin help section:\nctrl + shift + e: switch to admin role.\nType 'admin' for admin name and profile pic. Type 'normal' for ur normal profile pic and name.\n\n\nctrl + shift + a: add a new admin\n\nctrl + shift + v: view all the rooms.")
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
    if (e.ctrlKey && e.shiftKey && e.key == "V"){
        e.preventDefault()
        if (localStorage.getItem("admin") == true || localStorage.getItem("admin") == "true"){
            onValue(ref(db, "rooms"), (snapshot) => {
                const all = Object.values(snapshot.val())
                let pages = Math.floor(all.length/21)
                let rem = all.length % 20
                console.log("pages", pages, " ", "rem", rem)
                if (rem > 0) pages++
                let items = ""
                all.forEach(item => {
                    items += item + "\n"
                })
                for (var i = 1; i <= pages; i++){
                    let vow
                    if (rem > 0) vow = pages; else vow = 20
                    alert(`Page ${i} of showing ${vow} rooms` + items)
                }
                
            }, {onlyOnce: true})
        }
        
    }
})

let previousOnline = null
let onlineNum
let partofmain = ""
let isOnMain = ""

function roomNameGenerator(){
    const words = ["Funk", "Sigma", "Rizzler", "Apex", "Silly", "Gorilla", "Yass", "Slay", "Queen", "Rizzy", "Word", "Elephant", "Slow", "Sloth", "Monkey", "Black", "White", "Yellow", "Red", "T-rex", "Bob", "Boom", "Gooner", "Ohio", "Gyatt", "Run", "Walk", "Jog", "Trot", "Peculiar", "Gag", "Gagging", "Sleeping", "Snoring", "Easy", "Pickings", "Trigger", "Negotiater", "Liar", "River", "Cow", "LIGMA", "b@115", "WASTER", "Garbage", "Port", "Ship", "Slimy", "Sticky", "Liquidy", "slowy", "MOMMMMMMMMY"]
    let word = ""
    for (let i = 0; i < 3; i++){
        const randomIndex = Math.floor(Math.random() * words.length);
        word += words[randomIndex]
    }
    return word
}

// search for members

document.getElementById("search-people").addEventListener("input", () => {
    const allLi = document.querySelectorAll("#people-online ul li")
    allLi.forEach(li => {
        if (!li.textContent.toLocaleLowerCase().includes(document.getElementById("search-people").value)){
            li.classList.add("hide")
        } else {
            li.classList.remove("hide")
        }
    })
})

let previousBannedRef = null
async function checkBannedPeople(id){
    console.log("1")
    const bannedRef = `chat/${id}/ban`
    if (previousBannedRef !== null){
        off(previousBannedRef)
    }
    previousBannedRef = ref(db, `chat/${id}/ban`)
    onValue(previousBannedRef, async function(snapshot){
        const banned = snapshot
        if (banned.val() == null) {
            document.getElementById("banned").innerHTML = ""
            const li = document.createElement("li")
            li.textContent = "Nobody is banned here 😀"
            document.getElementById("banned").appendChild(li)
        } else {
            document.getElementById("banned").innerHTML = ""
            const valkeys = Object.keys(banned.val())
            console.log(valkeys.length)
            for(var i = 0; i < valkeys.length; i++){
                // this prints: console.log(i)
                const valKey = valkeys[i]
                const userDisplayName = await get(ref(db, `users/${valKey}/displayName`))
                // anything in here doesn't print or run
                const li = document.createElement("li")
                li.textContent = userDisplayName.val()
                li.style.cursor = "pointer"
                li.classList.add("banned")
                li.id = `banned-${valKey}`
                li.dataset.userId = valKey
                const userInfo = document.getElementById("user-info")
                li.addEventListener("click", async function(e){
                    console.log(userInfo.style.width)
                    userInfo.style.top = e.clientY -100 +"px"
                    const userNickname = await get(ref(db, `users/${valKey}/nickname`))
                    if (userNickname.val() !== null){
                        document.getElementById("vowwwwidk").textContent = `${userNickname.val()} (${li.textContent})`
                    } else {
                        document.getElementById('vowwwwidk').textContent = li.textContent
                    }
    
                    if (localStorage.getItem("admin") == true || localStorage.getItem("admin") == "true"){
                        document.getElementById("unban").style.display = "block"
                    }
                    
                    const unban = document.getElementById("unban")
                    unban.addEventListener("click", function(){
                        const uid = li.id.split("-")[1]
                        const unbanConfirm = confirm("Unban this person from this chat")
                        if (unbanConfirm){
                            remove(ref(db, bannedRef + "/" + uid))
                        }
                    })
                    const friendRequestBtn = document.getElementById("profile-add-friend")
                    const clone = friendRequestBtn.cloneNode(true)
                    friendRequestBtn.replaceWith(clone)
                    clone.addEventListener("click", () => {
                        sendFriendRequest(li.id.split("-")[1], false)
                    })
                    userInfo.style.left = li.getBoundingClientRect().left - 200 + "px"
                    document.getElementById("profile-add-friend").style.display = "flex"
                    userInfo.style.display = "flex"
                    const userProfilePic = await get(ref(db, `users/${valKey}/profilePic`))
                    var img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = userProfilePic.val();
                    img.referrerPolicy = "no-referrer"
                    // The magic begins after the image is successfully loaded
                    img.onload = function () {
                        console.log("eee")
                        var canvas = document.createElement('canvas'),
                            ctx = canvas.getContext('2d');
                    
                        canvas.height = img.naturalHeight;
                        canvas.width = img.naturalWidth;
                        ctx.drawImage(img, 0, 0);
                    
                        // Unfortunately, we cannot keep the original image type, so all images will be converted to PNG
                        // For this reason, we cannot get the original Base64 string
                        var uri = canvas.toDataURL('image/jpg'),
                        b64 = uri.replace(/^data:image\/jpg;base64,/, "");
                    
                        document.getElementById("profile-pic").style.backgroundImage = `url("${b64}")`
                        var blockSize = 5, // only visit every 5 pixels
                        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
                        canvas = document.createElement('canvas'),
                        context = canvas.getContext && canvas.getContext('2d'),
                        data, width, height,
                        i = -4,
                        length,
                        rgb = {r:0,g:0,b:0},
                        count = 0;
    
                        if (!context) {
                            return defaultRGB;
                        }
    
                        height = canvas.height = img.naturalHeight || img.offsetHeight || img.height;
                        width = canvas.width = img.naturalWidth || img.offsetWidth || img.width;
    
                        context.drawImage(img, 0, 0);
    
                        try {
                            data = context.getImageData(0, 0, width, height);
                        } catch(e) {
                            /* security error, img on diff domain */
                            return defaultRGB;
                        }
    
                        length = data.data.length;
    
                        while ( (i += blockSize * 4) < length ) {
                            ++count;
                            rgb.r += data.data[i];
                            rgb.g += data.data[i+1];
                            rgb.b += data.data[i+2];
                        }
    
                        // ~~ used to floor values
                        rgb.r = ~~(rgb.r/count);
                        rgb.g = ~~(rgb.g/count);
                        rgb.b = ~~(rgb.b/count);
                        console.log(rgb)
                        let dominantColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
                       /* const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
                        const colorCounts = {};
                        for (let i = 0; i < imageData.length; i += 4) {
                            const r = imageData[i];
                            const g = imageData[i + 1];
                            const b = imageData[i + 2];
                            const color = `rgb(${r},${g},${b})`;
                            colorCounts[color] = (colorCounts[color] || 0) + 1;
                        }
                        let dominantColor;
                        let maxCount = 100;
                        console.log(colorCounts)
                        for (const color in colorCounts) {
                            console.log("Color:", color, "  ColorCounts[color]", colorCounts[color])
                            if (colorCounts[color] > maxCount) {
                                maxCount = colorCounts[color];
                                console.log(maxCount)
                                dominantColor = color;
                            }
                        } */
                        document.getElementById("profile-background").style.backgroundColor = dominantColor
                    }
                })
                console.log(li)
                document.getElementById("banned").appendChild(li)
            }
                
        }
    })
}

let previousMemberRef = null

async function checkMembers(id){
    console.log("1")
    const memberRef = `chat/${id}/members`
    if (previousMemberRef !== null){
        off(previousMemberRef)
    }
    previousMemberRef = ref(db, `chat/${id}/members`)
    onValue(previousMemberRef, async function(snapshot){
        const members = snapshot
        if (members.val() == null) {
            document.getElementById("members").innerHTML = ""
            const li = document.createElement("li")
            li.textContent = "Nobody is here"
            document.getElementById("members").appendChild(li)
        } else {
            document.getElementById("members").innerHTML = ""
            const valkeys = Object.keys(members.val())
            console.log(valkeys.length)
            for(var i = 0; i < valkeys.length; i++){
                // this prints: console.log(i)
                const valKey = valkeys[i]
                const userDisplayName = await get(ref(db, `users/${valKey}/displayName`))
                // anything in here doesn't print or run
                const li = document.createElement("li")
                li.textContent = userDisplayName.val()
                li.style.cursor = "pointer"
                li.classList.add("member")
                li.id = `member-${valKey}`
                li.dataset.userId = valKey
                const userInfo = document.getElementById("user-info")
                li.addEventListener("click", async function(e){
                    console.log(userInfo.style.width)
                    userInfo.style.top = e.clientY -100 +"px"
                    const userNickname = await get(ref(db, `users/${valKey}/nickname`))
                    if (userNickname.val() !== null){
                        document.getElementById("vowwwwidk").textContent = `${userNickname.val()} (${li.textContent})`
                    } else {
                        document.getElementById('vowwwwidk').textContent = li.textContent
                    }
                    userInfo.style.left = li.getBoundingClientRect().left - 200 + "px"
                    userInfo.style.display = "flex"
                    const friendRequestBtn = document.getElementById("profile-add-friend")
                    const clone = friendRequestBtn.cloneNode(true)
                    friendRequestBtn.replaceWith(clone)
                    clone.addEventListener("click", () => {
                        sendFriendRequest(li.id.split("-")[1], false)
                    })
                    const userProfilePic = await get(ref(db, `users/${valKey}/profilePic`))
                    document.getElementById("unban").style.display = "none"
                    if (settings.uid == li.id.split("-")[1]){
                        document.getElementById("profile-add-friend").style.display = "none"
                    } else {
                        document.getElementById("profile-add-friend").style.display = "block"
                    }
                    var img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = userProfilePic.val();
                    img.referrerPolicy = "no-referrer"
                    // The magic begins after the image is successfully loaded
                    img.onload = function () {
                        console.log("eee")
                        var canvas = document.createElement('canvas'),
                            ctx = canvas.getContext('2d');
                    
                        canvas.height = img.naturalHeight;
                        canvas.width = img.naturalWidth;
                        ctx.drawImage(img, 0, 0);
                    
                        // Unfortunately, we cannot keep the original image type, so all images will be converted to PNG
                        // For this reason, we cannot get the original Base64 string
                        var uri = canvas.toDataURL('image/jpg'),
                        b64 = uri.replace(/^data:image\/jpg;base64,/, "");
                    
                        document.getElementById("profile-pic").style.backgroundImage = `url("${b64}")`
                        var blockSize = 5, // only visit every 5 pixels
                        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
                        canvas = document.createElement('canvas'),
                        context = canvas.getContext && canvas.getContext('2d'),
                        data, width, height,
                        i = -4,
                        length,
                        rgb = {r:0,g:0,b:0},
                        count = 0;
    
                        if (!context) {
                            return defaultRGB;
                        }
    
                        height = canvas.height = img.naturalHeight || img.offsetHeight || img.height;
                        width = canvas.width = img.naturalWidth || img.offsetWidth || img.width;
    
                        context.drawImage(img, 0, 0);
    
                        try {
                            data = context.getImageData(0, 0, width, height);
                        } catch(e) {
                            /* security error, img on diff domain */
                            return defaultRGB;
                        }
    
                        length = data.data.length;
    
                        while ( (i += blockSize * 4) < length ) {
                            ++count;
                            rgb.r += data.data[i];
                            rgb.g += data.data[i+1];
                            rgb.b += data.data[i+2];
                        }
    
                        // ~~ used to floor values
                        rgb.r = ~~(rgb.r/count);
                        rgb.g = ~~(rgb.g/count);
                        rgb.b = ~~(rgb.b/count);
                        console.log(rgb)
                        let dominantColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
                        document.getElementById("profile-background").style.backgroundColor = dominantColor
                    }
                })
                console.log(li)
                document.getElementById("members").appendChild(li)
            }
                
        }
    })
}

let previousRef = null
async function whichOne(id, main, part){
    let limit = 50
    document.getElementById("nic").style.display = "block"
    document.getElementById("roomNameDiv").style.display = "flex"
    document.getElementById("people").style.display = "flex"
    await checkBannedPeople(id)
    await checkMembers(id)
    set(ref(db, `chat/${id}/members/${settings.uid}`), true)
    if (previousRef !== null){
        off(previousRef)
    }
    if (main){
        previousRef = query(ref(db, `chat/main/content/${part}`), limitToLast(limit))
        document.getElementById("nic").style.display = "none"
    } else {
        previousRef = query(ref(db, `chat/${id}/content`), limitToLast(limit))
        document.getElementById("nic").style.display = "block"
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

    document.getElementById("people-online").style.display = "flex"
    // making chat private
    const privateBtn = document.getElementById("status-of-chat")
    const status = await get(ref(db, `chat/${id}/private`))
    if (status == null || status == false){
        privateBtn.checked = true
    } else if(status) {
        privateBtn.checked = false
    }
    privateBtn.addEventListener("change", async function(){
        if (privateBtn.checked == true){
            await set(ref(db, `chat/${id}/private`), true)
            alert("this chat is now not available to join")
        } else if(privateBtn.checked == false){
            await set(ref(db, `chat/${id}/private`), false)
            alert("this chat is now available to join")
        }
    })

    // showing banned people

    // put messages
    onValue(location, async function(snapshot){
        const val = snapshot.val()
        
        if (val == null){
            if (main){
                set(ref(db, "chat/main/content/" + part), "")
            } else {
                // seeing if the room doesn't exist or doesn't have any content, then create the room
                set(ref(db, "chat/" + id + "/content"), "")
                if (id.length !== 50){
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
            const allProfilePics = []
            let hehe = []
            console.log(messages)
            //console.log(messages)
            for (let i = 0; i < messages.length; i++){
                const valArray = messages[i][1]
                let listener
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
                const date1 = new Date().getMilliseconds()
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
            let add = 0
            for (let b = 0; b < hehe.length; b++){
                add += hehe[b]
            }
            console.log(add/hehe.length)
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
            chatBox.scrollTo({
                top: chatBox.scrollHeight,
                behavior: 'smooth'
            });
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





joinButton.addEventListener("click", async () => {
    onValue(ref(db, "rooms/"), async (snapshot) => {
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
            const privateStatus = await get(ref(db, `chat/${randomCode}/private`))
            if (privateStatus.val() == true){
                alert("this chat is not open to other users")
                window.location.reload()
                return false
            }
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
            }, {onlyOnce: true})
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

document.getElementById("roomName").addEventListener("focusout", () => {
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
    set(ref(db, `chat/${randomCode}/creator`), settings.uid)
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
        const send = [text, `${new Date().toLocaleDateString('en-US', {month:"long", day:"numeric", year:"numeric"})} at ${new Date().toLocaleTimeString()}`, "", settings.nickname == null ? settings.displayName : settings.nickname,  sendingAttachment, settings.uid, settings.profilePic]
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
                    newli.textContent = vow + " " + "(" + easy + ")"
                } else {
                    newli.textContent = value + " " + "(" + easy + ")"
                }
                newli.id = easy
                let colors = ["red", "rgb(0, 255, 0)", "orange", "rgb(9, 149, 243)", "rgb(220, 9, 243)", "rgb(243, 224, 9)", "rgb(255, 255, 255)", "rgb(158, 216, 255)", "rgb(9, 243, 149)", "rgb(133, 147, 255)", "rgb(249, 42, 118)", "rgb(244, 255, 118)", "rgb(197, 197, 197)", "rgb(173, 173, 173)", "rgb(181, 170, 240)", "rgb(186, 255, 130)"]
                newli.style.color = colors[Math.floor(Math.random() * colors.length)];
                newli.classList.add("easypickings")
                newli.addEventListener("click", () => {
                    //console.log("hi")
                    randomCode = newli.id
                    document.getElementById("roomNameDiv").style.display = "flex"
                    const litextcontent = newli.textContent
                    document.getElementById("roomName").value = litextcontent.substring(0, litextcontent.length-7)
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
                document.getElementById("niceone").appendChild(newli)
                console.log("f")
            })
        }
    }
})
// profiles
const userInfo = document.getElementById("user-info")
document.addEventListener("click", () => {
    document.onclick = function(e){
        if(e.target.id !== 'user-info' && e.target.id.split("-")[0] !== "banned" && e.target.id !== "profile-background" && e.target.id !== "profile-status" && e.target.id !== "profile-pic" && e.target.id !== "profile-add-friend" && e.target.id !== "vowwwwidk" && e.target.id.split("-")[0] !== "member"){
            setTimeout(() => {
                userInfo.style.height = "0px"
                userInfo.style.width = "0px"
                setTimeout(() => {
                    userInfo.style.display = "none"
                    userInfo.style.height = "200px"
                    userInfo.style.width = "200px"
                }, 300)
                
            }, 0)
        }
    }
})

// my-profile
const myProfileTab = document.getElementById("my-profile-tab")
myProfileTab.addEventListener("click", () => {
    document.getElementById("my-profile").style.display = "flex"
})

// close profile

document.getElementById("close-my-profile").addEventListener("click", ()=> {
    document.getElementById("my-profile").style.display = "none"
})

// sign out

document.getElementById("sign-out").addEventListener("click", () => {
    const ans = confirm("Do you want to sign out?")
    if (ans){
        localStorage.clear()
        window.location.reload()
    }
})

// nickname setter

document.getElementById("my-profile-nickname").addEventListener("focusout", () => {
    const nickname = document.getElementById("my-profile-nickname")
    settings.nickname = nickname.value.trim() == "" ? null : nickname.value
    set(ref(db, `users/${settings.uid}/nickname`), settings.nickname)
    localStorage.setItem("settings", JSON.stringify(settings))
})

// copy friending link

document.getElementById("friending-link-copy").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(`https://krupaltisgaonkar.github.io/chat/?addFriend=${btoa(settings.uid)}`)
        alert("copied")
    }
    catch {
        alert("failed to copy")
    }
})

// friending links
const urlParams = new URLSearchParams(window.location.search)
const friendingValue = urlParams.get("addFriend")
async function sendFriendRequest(senderId, url){
    console.log("run")
    const ee = await get(ref(db, `users/${settings.uid}/friends`))
    if (ee.val() !== null) {
        const all = Object.keys(ee.val())
        let found = false
        all.forEach(item => {
            if (senderId == item){
                found =true
            }
        })
        if (found){
            alert("user is already a friend")
            if (url == true){
                window.location.replace(window.location.href.split("?addFriend=")[0])
            }
            return false
        } else {
            try {
                await set(ref(db, `users/${senderId}/receivedFriendRequests/${settings.uid}`), true)
                alert("sucessfully sent friend request")
            } catch {
                alert("failed to send friend request")
            }
            if (url == true){
                window.location.replace(window.location.href.split("?addFriend=")[0])
            }
        }
    } else {
        try {
            await set(ref(db, `users/${senderId}/receivedFriendRequests/${settings.uid}`), true)
            alert("sucessfully sent friend request")
        } catch {
            alert("failed to send friend request")
        }
        window.location.replace(window.location.href.split("?addFriend=")[0])
    }
    
}

if (friendingValue !== null && atob(friendingValue).length == 28 && atob(friendingValue) !== settings.uid){
    sendFriendRequest(atob(friendingValue), true)
}

document.getElementById("my-friend-requests-tab").addEventListener("click", async () => {
    onValue(ref(db, `users/${settings.uid}/receivedFriendRequests`), async function (snapshot) {
        const friendRequests = snapshot
        document.getElementById("my-friend-requests").innerHTML = ""
        if (friendRequests.val() !== null){
            const allFriendRequests = Object.keys(friendRequests.val())
            console.log(allFriendRequests)
            for (var i = 0; i <allFriendRequests.length; i++){
                console.log(allFriendRequests[i])
                const displayName = await get(ref(db, `users/${allFriendRequests[i]}/displayName`))
                const nickname = await get(ref(db, `users/${allFriendRequests[i]}/nickname`))
                const imgSrc = await get(ref(db, `users/${allFriendRequests[i]}/profilePic`))
                const img = document.createElement("img")
                img.src = imgSrc.val()
                img.referrerPolicy = "no-referrer"
                const requestContainer = document.createElement("div")
                requestContainer.classList.add("my-friend-requests-container")
                requestContainer.id = `friend-request-${allFriendRequests[i]}`
                const name = document.createElement("div")
                name.classList.add("name")
                name.textContent = nickname.val() == null ? displayName.val() : `${nickname.val()} (${displayName.val()})`
                const accept = document.createElement("div")
                accept.textContent = "👍"
                accept.title = "accept"
                accept.id = `friend-request-accept-${allFriendRequests[i]}`
                accept.classList.add("accept")
                // add what to do when somebody accepts the friend request
                // chat id for friend will be [friendid]&[myid]
                accept.addEventListener("click", () => {
                    const longRandomCode = generateRandomCode(50)
                    set(ref(db, `users/${settings.uid}/friends/${decline.id.split("-")[3]}`), longRandomCode)
                    set(ref(db, `users/${decline.id.split("-")[3]}/friends/${settings.uid}`), longRandomCode)
                    set(ref(db, `chat/${longRandomCode}/content`), "")
                    set(ref(db, `chat/${longRandomCode}/private`), true)
                    remove(ref(db, `users/${settings.uid}/receivedFriendRequests/${decline.id.split("-")[3]}`))
                    alert("Accepted friend request")
                })
                console.log(allFriendRequests[i])
                const decline = document.createElement("div")
                decline.classList.add("decline")
                decline.textContent = "👎"
                decline.title = "decline"
                decline.id = `friend-request-decline-${allFriendRequests[i]}`
                decline.addEventListener("click", () => {
                    console.log("click")
                    console.log(`users/${settings.uid}/receivedFriendRequests/${decline.id.split("-")[3]}`)
                    remove(ref(db, `users/${settings.uid}/receivedFriendRequests/${decline.id.split("-")[3]}`))
                    alert("Removed friend request")
                })
                document.getElementById("my-friend-requests").appendChild(requestContainer)
                requestContainer.appendChild(img)
                requestContainer.appendChild(name)
                requestContainer.appendChild(accept)
                requestContainer.appendChild(decline)
            }
        }
    })
    document.getElementById("my-friend-requests-container").style.display = "block"
})

document.getElementById("friend-requests-close").addEventListener("click", () => {
    document.getElementById("my-friend-requests-container").style.display = "none"
})

// friending

onValue(ref(db, `users/${settings.uid}/friends`), async (snapshot) => {
    const val = snapshot.val()
    document.getElementById("my-friends").innerHTML = ""
    if (val !== null){
        const allFriends = Object.keys(val)
        console.log(allFriends)
        // can't use forEach because doesn't support async operations
        for (let i = 0; i < allFriends.length; i++){
            const friend = allFriends[i]
            const friendNick = await get(ref(db, `users/${friend}/nickname`))
            const friendDisplay = await get(ref(db, `users/${friend}/displayName`))
            const totalString = friendNick.val() == null ? friendDisplay.val() : `${friendNick.val()} (${friendDisplay.val()})`
            const img = await get(ref(db, `users/${friend}/profilePic`))
            const li = document.createElement("li")
            li.id = `friend-${friend}`
            li.innerHTML = `<img src = "${img.val()}" referrerPolicy = "no-referrer"  cross-origin = "Anonymous">${totalString}`
            li.addEventListener("click", async () => {
                const getRandomCode = await get(ref(db, `users/${settings.uid}/friends/${li.id.split("-")[1]}`))
                randomCode = getRandomCode.val()
                await whichOne(getRandomCode.val(), false, "")
                document.getElementById("roomNameDiv").style.display = "none"
                document.getElementById("people").style.display = "none"
                document.getElementById("nic").style.display = "none"
            })
            document.getElementById("my-friends").appendChild(li)
        }
    } else {
        return false
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