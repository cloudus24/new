function rendomId(length = 6) {
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomDigit = Math.floor(Math.random() * 10); 
      result += randomDigit;
    }
    return result;
  }

  module.exports = {rendomId}