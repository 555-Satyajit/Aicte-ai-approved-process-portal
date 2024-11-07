const mongoose = require('mongoose');

const personInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  idNumber: { type: String, unique: true, required: true },
});

const PersonInfo = mongoose.model('PersonInfo', personInfoSchema);

module.exports = PersonInfo;