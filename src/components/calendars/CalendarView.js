import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  Container,
  Dialog,
  DialogContent, 
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import AddCalendar from "./AddCalendar";
import CalendarCard from "./CalendarCard";
import useCalendars from "./useCalendars";

const CalendarsView = () => {
    const { calendars, loading, refreshCalendars } = useCalendars();
    const [isAddCalendarFormOpen, setIsAddCalendarFormOpen] = useState(false);

    const renderCalendarSection = (calendars) => {
        return (
            <Container sx={{ display: 'flex', flexWrap: 'wrap', mt: 2, justifyContent: 'space-between', alignItems: 'center', margin: '0 auto', padding: '50px' }}>
                {calendars.map((calendar) => (
                    <CalendarCard key={calendar.key} calendar={calendar} />
                ))}
            </Container>
        );
    }

    const handleAddCalendarClick = () => {
        setIsAddCalendarFormOpen(true);
    };

    const handleAddCalendarFormClose = () => {
        setIsAddCalendarFormOpen(false);
        refreshCalendars();
    };
 
    return (
        <Container>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">Calendars</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddCalendarClick}
                >
                    Add Calendar
                </Button>
            </Stack>
            {loading ? (
                [...Array(8)].map((e, i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      width={"100%"}
                      height={100}
                      sx={{ mt: 2 }}
                    />
                  ))
            ) : (
                renderCalendarSection(calendars)
            )}
            <Dialog
                open={isAddCalendarFormOpen}
                onClose={handleAddCalendarFormClose}
                fullWidth
                maxWidth="md"
            >
                <DialogContent>
                    <AddCalendar 
                    onClose={handleAddCalendarFormClose} />
                </DialogContent>
            </Dialog>
        </Container>
    );
}

export default CalendarsView;