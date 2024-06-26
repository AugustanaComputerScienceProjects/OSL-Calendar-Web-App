import { Autocomplete, FormControl, TextField } from "@mui/material";
import React from "react";

const AddCalendarForm = ({
    formData,
    groups,
    handleInputChange,
    setFormData,
}) => {
    return (
        <>
            {/* Calendar Name */}
            <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Calendar Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Welcome Week"
            />
            {/* Organization */}
            <FormControl margin="dense" fullWidth>
                <Autocomplete
                    margin="dense"
                    fullWidth
                    options={groups}
                    getOptionLabel={(option) => option}
                    value={formData.organization}
                    onChange={(calendar, newValue) => {
                        setFormData((prevFormData) => ({
                            ...prevFormData,
                            organization: newValue,
                        }))
                    }}
                    renderInput={(params) => <TextField {...params} label="Organization" />}
                />
            </FormControl>
            {/* Description */}
            <TextField
                margin="dense"
                name="description"
                label="Description"
                fullWidth
                required
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
            />
        </>
    )
}

export default AddCalendarForm;