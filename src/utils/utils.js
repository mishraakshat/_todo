const trimLowerElement = (arr) => {
    return arr.map(element => {
        if(typeof element === 'string'){
            const temp = element.trim().toLowerCase()
            return temp;
        }
        return element;
      });
}

module.exports = trimLowerElement