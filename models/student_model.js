const express = require('express');
const mongosse = require('mongoose');

const studentSchema = new mongosse.Schema({
    email : {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    regno: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    features:{
        type: Array,
    },
});

module.exports = new mongosse.model("Student",studentSchema);