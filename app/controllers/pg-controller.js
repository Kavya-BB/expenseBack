const geolib = require('geolib');
const Pg = require('../models/pg-model.js');
const { pgValidationSchema } = require('../validations/pg-validation.js');
const User = require('../models/user-model.js');
const pgCltr = {};

pgCltr.createPg = async (req, res) => {
    const body = req.body;
    const { error, value } = pgValidationSchema.validate(body, { abortEarly: false });
    if(error) {
        return res.status(400).json({ error: error.details.map(ele => ele.message) });
    }
    try {
        const user = await User.findById(req.userId);
        if(!user) {
            return res.status(404).json({ error: 'User not found!!!' });
        }
         if(user.role !== 'owner') {
            return res.status(403).json({ error: 'only owners can create PG Listing!!!' });
        }
        const existingPg = await Pg.findOne({
            'location.address': value.location.address,
            pgname: value.pgname
        });
        if(existingPg) {
            return res.status(409).json({ error: 'PG with a same name and address already exists!!!' });
        }
        const pgPhotos = Array.isArray(req.files?.pgPhotos) ? req.files.pgPhotos.map(file => file.path) : [];
        const pgCertificate = req.files?.pgCertificate?.[0]?.path || null;
        const pg = new Pg({ 
            ...value, 
            ownerId: req.userId, 
            pgPhotos, 
            pgCertificate 
        });
        await pg.save();
        res.status(201).json(pg);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong while creating PG!!!' });
    }
};

pgCltr.getAllPgs = async (req, res) => {
    try {
        const role = req.role;
        const userId = req.userId;
        let pgs;
        if(role === 'admin') {
            pgs = await Pg.find();
        } else if(role === 'owner') {
            pgs = await Pg.find({ ownerId: userId });
        } else {
            return res.status(403).json({ error: 'Access deneid' });
        }
        res.json(pgs);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

pgCltr.getPgById = async (req, res) => {
    const id = req.params.id;
    try {
        const role = req.role;
        const userId = req.userId;
        const pg = await Pg.findById(id);
        if(!pg) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        if (role === 'owner' && pg.ownerId.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized to access this PG!' });
        }
        res.json(pg);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

pgCltr.getPgLists = async (req, res) => {
  try {
    const pgs = await Pg.find({ isApproved: true }).select( "pgname location roomTypes description amenities pgPhotos rating" );
    if (!pgs || pgs.length === 0) {
      return res.status(404).json({ message: 'No PGs found' });
    }
    return res.status(200).json(pgs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

pgCltr.updatePg = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    try {
        const pg = await Pg.findById(id);
        if (!pg) {
            return res.status(404).json({ error: "PG not found" });
        }
        if (pg.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        let pgPhotos = pg.pgPhotos;
        if (Array.isArray(req.files?.pgPhotos)) {
            pgPhotos = [...pgPhotos, ...req.files.pgPhotos.map(f => f.path)];
        }
        let pgCertificate = pg.pgCertificate;
        if (req.files?.pgCertificate?.[0]) {
            pgCertificate = req.files.pgCertificate[0].path;
        }
        const updatedPg = await Pg.findByIdAndUpdate(
            id,
            {
                ...body,
                pgPhotos,
                pgCertificate
            },
            { new: true, runValidators: true }
        );
        res.json(updatedPg);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to update PG" });
    }
};

pgCltr.deletePg = async (req, res) => {
    const id = req.params.id;
    try{
        if (req.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can delete PG!' });
        }
        const pg = await Pg.findById(id);
        if(!pg) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        await Pg.findByIdAndDelete(id);
        res.json({ message: 'PG deleted successfully!', pg });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

pgCltr.verifyC = async (req, res) => {
    const pgId = req.params.id;
    try {
        const { isVerified } = req.body;
        const pg = await Pg.findById(pgId);
        if(!pg) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        pg.isVerified = isVerified;
        if(isVerified == false) {
            pg.isApproved = false;
        }
        await pg.save();
        res.json({ 
            message: pg.isVerified 
                ? "Certificate verified successfully" 
                : "Certificate verification removed", 
            isVerified: pg.isVerified, 
            isApproved: pg.isApproved
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

pgCltr.approvePg = async (req, res) => {
    const id = req.params.id;
    const { isApproved } = req.body;
    try {
        const pg = await Pg.findById(id);
        if(!pg) {
            return res.status(404).json({ error: 'something went wrong!!!' });
        }
        if(isApproved == true && pg.isVerified == false) {
            return res.status(400).json({ error: "Cannot approve PG because certificate is not verified" });
        }
        pg.isApproved = isApproved;
        if(isApproved == true) {
            pg.isVerified = true;
        }
        await pg.save();
        res.json({ message: pg.isApproved ? "Pg approved successfully" : "Pg approval removed", 
            isApproved: pg.isApproved, 
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

pgCltr.getNearbyPgs = async (req, res) => {
  try {
    let { latitude, longitude, radius = 5 } = req.query;
    latitude = Number(latitude);
    longitude = Number(longitude);
    radius = Number(radius);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }
    const pgs = await Pg.find({ isApproved: true });
    const nearbyPgs = pgs
      .filter(pg =>
        pg?.location?.coordinates?.latitude &&
        pg?.location?.coordinates?.longitude
      )
      .map(pg => {
        const distanceInMeters = geolib.getDistance(
          { latitude, longitude },
          {
            latitude: Number(pg.location.coordinates.latitude),
            longitude: Number(pg.location.coordinates.longitude)
          }
        );
        return {
          ...pg._doc,
          distance: distanceInMeters / 1000
        };
      })
      .filter(pg => pg.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    res.json(nearbyPgs);
  } catch (err) {
    console.error("Nearby PG error:", err);
    res.status(500).json({ error: err.message });
  }
};


module.exports = pgCltr;