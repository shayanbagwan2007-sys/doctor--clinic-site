const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to safely read from the JSON file
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { 
            appointments: [], 
            announcement: "Clinic Notice: Clinic will be off on 1st April 2026. Thanks for cooperation 🙏🏻😊" 
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
}

// Helper to safely write to the JSON file
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Route to get all appointments and the active announcement
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data file' });
    }
});

// Route to submit a new appointment request
app.post('/api/appointments', (req, res) => {
    try {
        const { name, phone, service, date, note } = req.body;
        if (!name || !phone || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const data = readData();
        const newAppt = {
            id: Date.now(),
            name,
            phone,
            service,
            date,
            note,
            status: 'Pending',
            timestamp: new Date().toLocaleString()
        };
        
        data.appointments.push(newAppt);
        writeData(data);
        res.status(201).json(newAppt);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save appointment request' });
    }
});

// Route to update a specific appointment status (Confirmed / Cancelled)
app.put('/api/appointments/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const data = readData();
        
        const appt = data.appointments.find(a => a.id === id);
        if (!appt) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        appt.status = status;
        writeData(data);
        res.json(appt);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Route to delete a single appointment record
app.delete('/api/appointments/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = readData();
        
        data.appointments = data.appointments.filter(a => a.id !== id);
        writeData(data);
        res.json({ message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// Route to delete all appointment history
app.delete('/api/appointments', (req, res) => {
    try {
        const data = readData();
        data.appointments = [];
        writeData(data);
        res.json({ message: 'All records cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear registry' });
    }
});

// Route to publish/update the home page announcement notice
app.post('/api/announcement', (req, res) => {
    try {
        const { text } = req.body;
        const data = readData();
        data.announcement = text;
        writeData(data);
        res.json({ message: 'Announcement updated', announcement: text });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update announcement' });
    }
});

// Direct entry points
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});