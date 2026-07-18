const { 
  addToDatabase, 
  getFromDatabase, 
  getAllFromDatabase, 
  updateToDatabase, 
  deleteFromDatabase 
} = require('../services/firebaseService');

const COLLECTIONS = {
  SERVICES: 'services'
};

//Post the new service data to the backend
const createService = async (req, res) => {

    try {

        const serviceData = req.body;
        //Check if the serviceData is valid
        if(!serviceData || !serviceData.name || !serviceData.price || !serviceData.processingTime) {
            return res.status(400).json({ error: 'Invalid service data' });
        }
        //Add the new service to the database
        const newService = await addToDatabase(COLLECTIONS.SERVICES, serviceData);
        res.status(201).json(newService);

    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }

}