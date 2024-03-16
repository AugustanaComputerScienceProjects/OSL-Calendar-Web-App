import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { format, isSameDay } from "date-fns";
import React, { useState } from "react";

import AddEvent from "./AddEvent";
import EventCard from "./EventCard";
import useEvents from "./useEvents";

const EventsView = () => {
  const { events, loading, refreshEvents } = useEvents();
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);

  const handleEventAdded = () => {
    refreshEvents();
  };

  const groupEventsByDate = (events) => {
    const groupedEvents = {};
    events.forEach((event) => {
      const eventDate = new Date(event.startDate);
      const dateKey = format(eventDate, "yyyy-MM-dd");
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });
    return groupedEvents;
  };

  const renderEventSection = (date, events) => {
    return (
      <Grid container spacing={2} key={date} sx={{ mt: 2 }}>
        <Grid item xs={3}>
          <Typography variant="h6">
            {format(new Date(date), "MMM d")}
          </Typography>
          <Typography variant="body1">
            {format(new Date(date), "EEEE")}
          </Typography>
        </Grid>
        <Grid item xs={9}>
          {events.map((event) => (
            <EventCard key={event.key} event={event} />
          ))}
        </Grid>
      </Grid>
    );
  };
  const handleAddEventClick = () => {
    setIsAddEventFormOpen(true);
  };

  const handleAddEventFormClose = () => {
    setIsAddEventFormOpen(false);
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Events</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEventClick}
          >
            Add Event
          </Button>
        </Stack>
        {loading ? (
          <Typography variant="body1">Loading...</Typography>
        ) : (
          <>
            {renderEventSection(
              format(new Date(), "yyyy-MM-dd"),
              events.filter((event) =>
                isSameDay(new Date(event.startDate), new Date())
              )
            )}

            {Object.entries(groupEventsByDate(events))
              .filter(([date]) => new Date(date) > new Date())
              .map(([date, events]) => renderEventSection(date, events))}
          </>
        )}
      </Box>
      <Dialog
        open={isAddEventFormOpen}
        onClose={handleAddEventFormClose}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <AddEvent />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default EventsView;
