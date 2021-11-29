const express = require('express');
const mongosse = require('mongoose');

const lecturerSchema = new mongosse.Schema({
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
    lecturerId : {
        type: String,
        required: true,
    },
});

module.exports = new mongosse.model("Lecturer",lecturerSchema);