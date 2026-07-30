//Context Provider for Admin Notifications (New Applications, Status Updates, etc.
import React, { createContext, useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

