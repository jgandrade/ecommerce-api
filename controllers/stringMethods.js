module.exports.capitalizeName = (name) => {
    if(name.length > 50){
        return false;
    }
    let newName = name.split(" ").map(e => e[0].toUpperCase().concat(e.slice(1, e.length))).join(" ");
    return newName;
}

// https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
module.exports.validateEmail = (email) => {
    if(email.length > 50){
        return false;
    }
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports.validateNumber = (number) => {
    const re = /^(\+\d{1,3}[- ]?)?\d{11}$/;
    return re.test(String(number));
}



