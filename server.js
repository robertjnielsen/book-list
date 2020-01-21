'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
require('ejs');

const app = express();
const PORT = process.env.PORT || 8081;
