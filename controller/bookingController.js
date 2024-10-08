import BookingModel from "../model/BookingModel.js";
import mongoose from "mongoose";
import ListingModel from "../model/ListingModel.js";
import { populate } from "dotenv";

//*************** ADD NEW BOOKING *********************/
export const bookingPlace = async (req, res, next) => {
  try {
    const {
      listing,
      checkIn,
      checkOut,
      numberOfAdults,
      numberOfChildren,
      totalPrice,
    } = req.body;
    const user = req.user;

    // Validation
    if (!listing || !checkIn || !checkOut || !numberOfAdults || !totalPrice) {
      return res.status(422).json({
        message: "Please Provide All Fields!",
      });
    }

    // Fetch the listing to get available dates
    const listingData = await ListingModel.findById(listing);
    if (!listingData) {
      return res.status(404).json({
        message: "Error: Invalid Listing Id!",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if the booking dates fall within available dates
    const isAvailable = listingData.availableDates.some((dateRange) => {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      return checkInDate >= startDate && checkOutDate <= endDate;
    });

    if (!isAvailable) {
      return res.status(400).json({
        message:
          "Error: Booking dates do not fall within the available dates for this listing.",
      });
    }

    // Check for date overlap with existing bookings for the same listing
    const conflictingBookings = await BookingModel.find({
      listing,
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }, // Overlaps with the new booking
      ],
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        message:
          "Booking conflict: The selected dates overlap with existing bookings.",
      });
    }

    // Booking
    const booking = new BookingModel({
      listing,
      checkIn,
      checkOut,
      numberOfAdults,
      numberOfChildren,
      totalPrice,
      guest: user.userId,
    });
    await booking.save();

    return res.status(201).json({
      message: "Booking Successfull!",
      data: {
        booking,
      },
    });
  } catch (err) {
    console.log("err", err);
    return res.status(500).json({
      message: "Internal Server Error!",
      error: err.message,
    });
  }
};

//********* GET ALL BOOKINGS OF USER (BY USER ID) ************/
export const getBookingOfUser = async (req, res, next) => {
  try {
    const user = req.user;

    //Get Bookings
    const allBookingsOfUser = await BookingModel.find({
      guest: user.userId,
    }).populate({
      path: "listing",
      populate: {
        path: "property",
      },
    });
    if (allBookingsOfUser.length === 0) {
      return res.status(404).json({
        message: "No places found for the user.",
      });
    }

    //Success response
    return res.status(200).json({
      message: "Success",
      data: {
        allBookingsOfUser,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error!",
      error: err.message,
    });
  }
};

//********* GET BOOKING DETAILS (BY BOOKING ID) ************/
export const getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ID!",
      });
    }

    //Get Booking
    const booking = await BookingModel.findById(id).populate("listing");
    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    //Res
    return res.status(200).json({
      message: "Success",
      data: {
        booking,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error!",
      error: err.message,
    });
  }
};

//********* GET ALL BOOKINGS OF USER (BY LISTING ID) ************/
export const getBookingOfUserForListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ID!",
      });
    }

    //Get Bookings
    const bookingOnListing = await BookingModel.find({
      guest: user.userId,
      listing: id,
    }).populate("listing");

    //Success response
    return res.status(200).json({
      message: "Success",
      data: {
        bookingOnListing,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error!",
      error: err.message,
    });
  }
};

//********* GET RESERVATIONS ************/
export const getReservations = async (req, res, next) => {
  try {
    const user = req.user;

    //Get Bookings
    const reservations = await BookingModel.find({})
      .populate({
        path: "listing",
        populate: {
          path: "property",
          match: { owner: user.userId },
        },
      })
      .populate({
        path: "guest",
        select: "_id name email mobile",
      });

    //Success response
    return res.status(200).json({
      message: "Success",
      data: {
        reservations,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error!",
      error: err.message,
    });
  }
};
