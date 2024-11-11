import moment from "moment";

import Admin from "../models/Admin.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateCertificate } from "../utils/generateCertificate.js";
import { validationResult } from "express-validator";
import { uploadFileToCloudinary,deleteFromCloudinary } from "../utils/cloudinaryServices.js";


//@desc     create a new Event
//@route    POST /event/createEvent
//@access   private {convenor, member}
export const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { banner, order } = req.files;
    if(!banner || !order){
      return res.status(400).send({
        success:false,
        message:'Please provide both banner and order file.'
      });
    }
    //get rest of event details form req.body
    const {
      name,
      venue,
      startDate,
      endDate,
      description,
      committee,
      createdBy,
    } = req.body;
    //parse committee and creator details
    const parsedCommittee = JSON.parse(committee);
    const parsedCreator = JSON.parse(createdBy);

    // uploading images

    const bannerData= await uploadFileToCloudinary(banner[0].buffer,'Banners','banner');
    const orderData= await uploadFileToCloudinary(order[0].buffer,'Orders','order');

    // save data to db
    const newEvent = new Event({
      name,
      venue,
      startDate,
      endDate,
      description,
      bannerName:bannerData.public_id,
      bannerPath:bannerData.url,
      orderName:orderData.public_id,
      orderPath:orderData.url,
      committee: parsedCommittee,
      createdBy: parsedCreator,
    });
    const savedEvent = await newEvent.save();
    const committeeId = parsedCommittee.id;
    const convenor = await Admin.findOne({ committeeId }).select("email");
    const admin = await Admin.findOne({ role: "admin" }).select("email");
    const convenorMailOptions = {
      from: "planZ <planZsp@gmail.com>",
      to: convenor.email,
      subject: `New Event Created - ${name}`,
      text: `Hi,\n\nA new event has been created.\n\nEvent Name: ${name}.\nCreated By: ${parsedCreator.name}.\n\nPlease Login to review the event under Unapproved Events Section.\nRegards Team planZ.`,
    };
    sendEmail(convenorMailOptions);

    const adminMailOptions = {
      from: "planZ <planZsp@gmail.com>",
      to: admin.email,
      subject: `New Event Created - ${name}`,
      text: `Hi,\n\nA new event has been created.\n\nEvent Name: ${name}.\nCreated By: ${parsedCreator.name}.\n\nPlease Login to review or Approve the event under Approve Events Section.\nRegards Team planZ.`,
    };
    sendEmail(adminMailOptions);
    return res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     upload report of an Event
//@route    POST /event/uploadReport
//@access   private {convenor, member}
export const uploadReport = async (req, res) => {
  try {
    const reportData=await uploadFileToCloudinary(req.file.buffer,'Reports','report');
    //get id of event  form req.body
    const { id } = req.body;
    //update event
    const filter = { _id: id };
    const update = { reportName:reportData.public_id, reportPath:reportData.url, status: true };
    const updatedEvent = await Event.findOneAndUpdate(filter, update, {
      new: true,
    });
    //send success response
    res.status(201).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     upload photos of an Event
//@route    POST /event/uploadPhotos
//@access   private {convenor, member}
export const uploadPhotos = async (req, res) => {
  try {
    const { id } = req.body;
    if(!id){
       return res.status(400).send({
        message:'Id is required.'
       });
    }
    const uploadedPhotos = req.files;
    const photosArray = [];
    for(let photo of uploadedPhotos){
      const pic=await uploadFileToCloudinary(photo.buffer,'Event Images','events');
      photosArray.push({
        filename: pic.public_id,
        path: pic.url,
      });
    };
    
    //update event
    const filter = { _id: id };
    const update = { photos: photosArray, isPhotoUploaded: true };
    const updatedEvent = await Event.findOneAndUpdate(filter, update, {
      new: true,
    });
    //send success response
    res.status(201).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a single event
//@route    POST /events/getEvent
//@access   public
export const getEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findOne({ _id: eventId });
    if (!event) return res.status(404).json({ msg: "No Event Found " });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a list of all unApproved events
//@route    GET /events/unapprovedEvents
//@access   private {admin}
export const getUnApprovedEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: "false" });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a list of all unApproved events of a committee
//@route    POST /events/committeeUnapprovedEvents
//@access   private {convenor, member}
export const getCommitteeUnApprovedEvents = async (req, res) => {
  try {
    const { committeeId } = req.body;
    const events = await Event.find({
      isApproved: false,
      "committee.id": committeeId,
    });
    const sortedEvents = events.sort(
      (a, b) => moment(new Date(b.startDate)) - moment(new Date(a.startDate))
    );
    if (!events) res.status(401).json({ error: "No Events found" });
    res.status(200).json(sortedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a list of all published events
//@route    GET /events/publishedEvents
//@access   public
export const getPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ isPublished: "true" });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a list of all approved events
//@route    GET /events/approvedEvents
//@access   private {admin}
export const getApprovedEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: "true" });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     get a list of all approved events of a committee
//@route    POST /events/committeeApprovedEvents
//@access   private {convenor, member}
export const getCommitteeApprovedEvents = async (req, res) => {
  try {
    const { committeeId } = req.body;
    const events = await Event.find({
      isApproved: true,
      "committee.id": committeeId,
    });
    const sortedEvents = events.sort(
      (a, b) => moment(new Date(b.startDate)) - moment(new Date(a.startDate))
    );
    if (!events) res.status(401).json({ error: "No Events found" });
    res.status(200).json(sortedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     approve an event
//@route    POST /events/approveEvent
//@access   private {admin}
export const approveEvent = async (req, res) => {
  try {
    const { id } = req.body;
    const filter = { _id: id };
    const event=await findOne(filter);
    deleteFromCloudinary(event.orderName);
    const update = { isPublished: "true", isApproved: "true",orderName:undefined,orderPath:undefined };
    const publishedEvent = await Event.findOneAndUpdate(filter, update, {
      new: true,
    });
    res.status(201).json(publishedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     toggle whether an event should be published or not
//@route    POST /events/togglePublish
//@access   private {admin}
export const togglePublish = async (req, res) => {
  try {
    const { id, isPublished } = req.body;
    const filter = { _id: id };
    const update = { isPublished: !isPublished };
    const updatedEvent = await Event.findOneAndUpdate(filter, update, {
      new: true,
    });
    res.status(201).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     delete an events
//@route    POST /events/deleteEvent
//@access   private {admin}
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    // Fetch the event before deleting it to access the file paths
    const event = await Event.findById(eventId);
    const deletedEvent = await Event.deleteOne({ _id: eventId });
    if (deletedEvent) {
      if(deletedEvent.orderName) deleteFromCloudinary(deletedEvent.orderName);
      if(deletedEvent.bannerName) deleteFromCloudinary(deletedEvent.bannerName);
      if(deletedEvent.photos){
        for(let file of deletedEvent.photos){
          deleteFromCloudinary(file.fileName);
        }
      }
      await User.deleteMany({ "event.id": eventId });
      res.status(201).json({ msg: "Deleted Successfully" });
    } else {
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//@desc     send certificates of an event
//@route    POST /events/sendCertificate
//@access   private {admin, convenor, member}
export const sendCertificate = async (req, res) => {
  try {
    const { id, eventDate } = req.body;

    try {
      const users = await User.find({ "event.id": id });
      for (const user of users) {
        const certificate = await generateCertificate(
          user.name,
          user.event[0].name,
          eventDate
        );

        if (user.email) {
          const mailOptions = {
            from: "planZ <planZsp@gmail.com>",
            to: user.email,
            subject: `Event Certificate - ${user.event[0].name}`,
            text: `Dear ${user.name},\n\nThank You!\nFor attending the event "${user.event[0].name}". Attached to this email is your certificate.\n\nBest regards,\nTeam planZ .`,
            attachments: [
              {
                filename: `${user.name.split(" ")[0]}_certificate.pdf`,
                content: certificate,
              },
            ],
          };
          sendEmail(mailOptions);
        }
      }
      const filter = { _id: id };
      const update = { isCertificateGenerated: "true" };
      const updatedEvent = await Event.findOneAndUpdate(filter, update, {
        new: true,
      });
      if (updatedEvent) {
        res.status(200).json({ msg: "Certificates Sent" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
