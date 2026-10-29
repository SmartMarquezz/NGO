public without sharing class AcpSiteFormController {
    public class FormException extends Exception {
    }

    @AuraEnabled
    public static Id submitInquiry(String formType, String payloadJson) {
        if (String.isBlank(formType) || String.isBlank(payloadJson)) {
            throw new AuraHandledException('Form data is required.');
        }

        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
        Acp_Site_Inquiry__c row = new Acp_Site_Inquiry__c();
        row.Form_Type__c = formType.trim();
        row.Status__c = 'Submitted';
        row.Full_Name__c = asString(data.get('fullName'));
        row.Email__c = asString(data.get('email'));
        row.Phone__c = asString(data.get('phone'));
        row.Preferred_Contact__c = asMulti(data.get('preferredContact'));
        row.Interest_Areas__c = asMulti(data.get('interestAreas'));
        row.Availability__c = asMulti(data.get('availability'));
        row.Additional_Details__c = asString(data.get('additionalDetails'));
        row.Completing_As__c = asString(data.get('completingAs'));
        row.Participant_Name__c = asString(data.get('participantName'));
        row.Participant_Age__c = asString(data.get('participantAge'));
        row.Parent_Guardian_Name__c = asString(data.get('parentGuardianName'));
        row.Best_Check_In_Time__c = asMulti(data.get('bestCheckInTime'));
        row.Focus_Areas__c = asMulti(data.get('focusAreas'));
        row.Urgency__c = asString(data.get('urgency'));
        row.Community_Agreement__c = asMulti(data.get('communityAgreement'));
        row.Emergency_Acknowledgment__c = asString(data.get('emergencyAcknowledgment'));

        String firstName = asString(data.get('firstName'));
        String lastName = asString(data.get('lastName'));
        if (String.isBlank(row.Full_Name__c) && (String.isNotBlank(firstName) || String.isNotBlank(lastName))) {
            row.Full_Name__c = (nullToBlank(firstName) + ' ' + nullToBlank(lastName)).trim();
        }

        if (row.Form_Type__c == 'Contact' && String.isBlank(row.Interest_Areas__c)) {
            row.Interest_Areas__c = asString(data.get('topic'));
        }

        validate(row);

        try {
            row.Contact__c = upsertRelatedContact(row, firstName, lastName);
            Database.insert(row, AccessLevel.SYSTEM_MODE);
        } catch (FormException e) {
            throw new AuraHandledException(e.getMessage());
        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        }

        return row.Id;
    }

    private static Id upsertRelatedContact(Acp_Site_Inquiry__c row, String payloadFirstName, String payloadLastName) {
        if (String.isBlank(row.Email__c)) {
            return null;
        }

        String firstName = payloadFirstName;
        String lastName = payloadLastName;
        String sourceName = row.Full_Name__c;
        if (String.isBlank(sourceName) && String.isNotBlank(row.Participant_Name__c)) {
            sourceName = row.Participant_Name__c;
        }
        if ((String.isBlank(firstName) || String.isBlank(lastName)) && String.isNotBlank(sourceName)) {
            List<String> parts = sourceName.trim().split('\\s+');
            if (String.isBlank(firstName)) {
                firstName = parts[0];
            }
            if (String.isBlank(lastName)) {
                lastName = parts.size() > 1 ? parts[parts.size() - 1] : parts[0];
                if (parts.size() > 2) {
                    lastName = sourceName.substring(sourceName.indexOf(' ') + 1).trim();
                }
            }
        }
        if (String.isBlank(lastName)) {
            lastName = 'Unknown';
        }

        List<Contact> existing = [
            SELECT Id, FirstName, LastName, Email, Phone, Description, ACP_Form_Activity__c, Comment__c
            FROM Contact
            WHERE Email = :row.Email__c
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];

        Contact person = existing.isEmpty() ? new Contact() : existing[0];
        if (String.isNotBlank(firstName)) {
            person.FirstName = firstName;
        }
        person.LastName = lastName;
        person.Email = row.Email__c;
        if (String.isNotBlank(row.Phone__c)) {
            person.Phone = row.Phone__c;
        }

        String friendlyType = friendlyFormType(row.Form_Type__c);
        String details =
            'Form: ' +
            friendlyType +
            '\nInterest / topic: ' +
            nullToBlank(row.Interest_Areas__c) +
            '\nFocus: ' +
            nullToBlank(row.Focus_Areas__c) +
            '\nAvailability: ' +
            nullToBlank(row.Availability__c) +
            '\nMessage: ' +
            nullToBlank(row.Additional_Details__c) +
            '\nParticipant: ' +
            nullToBlank(row.Participant_Name__c) +
            '\nUrgency: ' +
            nullToBlank(row.Urgency__c);
        person.put('Comment__c', friendlyType + ' - ' + Datetime.now().format() + '\n' + details);
        appendFormActivity(person, friendlyType, details);

        String tag = 'All Care Plus site form: ' + row.Form_Type__c;
        if (String.isBlank(person.Description)) {
            person.Description = tag;
        } else if (!person.Description.contains(tag)) {
            person.Description = person.Description + '\n' + tag;
        }

        try {
            if (person.Id == null) {
                Database.insert(person, AccessLevel.SYSTEM_MODE);
            } else {
                Database.update(person, AccessLevel.SYSTEM_MODE);
            }
        } catch (DmlException e) {
            throw new FormException('Unable to create Contact: ' + e.getDmlMessage(0));
        }
        return person.Id;
    }

    private static void appendFormActivity(Contact person, String formLabel, String details) {
        String stamp = Datetime.now().format() + ' - ' + formLabel + '\n' + details + '\n---\n';
        String existing = (String) person.get('ACP_Form_Activity__c');
        if (String.isBlank(existing)) {
            person.put('ACP_Form_Activity__c', stamp);
        } else {
            String merged = stamp + existing;
            if (merged.length() > 131072) {
                merged = merged.substring(0, 131072);
            }
            person.put('ACP_Form_Activity__c', merged);
        }
    }

    private static String friendlyFormType(String formType) {
        if (formType == 'CPR_Inquiry') {
            return 'CPR Class Inquiry';
        }
        if (formType == 'Accept_Grow') {
            return 'Accept & Grow';
        }
        if (formType == 'Contact') {
            return 'Contact Us Message';
        }
        if (formType == 'Volunteer') {
            return 'Volunteer Interest';
        }
        return formType;
    }

    private static String nullToBlank(String value) {
        return value == null ? '' : value;
    }

    private static void validate(Acp_Site_Inquiry__c row) {
        if (row.Form_Type__c == 'Volunteer') {
            require(row.Full_Name__c, 'Full name is required.');
            require(row.Email__c, 'Email is required.');
            require(row.Phone__c, 'Phone is required.');
            require(row.Preferred_Contact__c, 'Preferred contact method is required.');
            require(row.Interest_Areas__c, 'Please select at least one interest area.');
            require(row.Availability__c, 'Please select your availability.');
        } else if (row.Form_Type__c == 'Accept_Grow') {
            require(row.Completing_As__c, 'Please tell us who is completing this form.');
            require(row.Participant_Name__c, 'Participant name is required.');
            require(row.Participant_Age__c, 'Participant age is required.');
            require(row.Email__c, 'Email is required.');
            require(row.Phone__c, 'Mobile phone is required.');
            require(row.Preferred_Contact__c, 'Preferred contact method is required.');
            require(row.Best_Check_In_Time__c, 'Please choose a check-in time.');
            require(row.Focus_Areas__c, 'Please select at least one focus area.');
            require(row.Urgency__c, 'Please select level of urgency.');
            require(row.Community_Agreement__c, 'Please acknowledge the community agreement.');
            require(row.Emergency_Acknowledgment__c, 'Please acknowledge the safety statement.');
        } else if (row.Form_Type__c == 'CPR_Inquiry') {
            require(row.Full_Name__c, 'Full name is required.');
            require(row.Email__c, 'Email is required.');
            require(row.Phone__c, 'Phone is required.');
            require(row.Preferred_Contact__c, 'Preferred contact method is required.');
            require(row.Interest_Areas__c, 'Please select at least one class type (or Not sure).');
            require(row.Focus_Areas__c, 'Please tell us why you need the class.');
            require(row.Availability__c, 'Please choose delivery format, experience, and timing.');
        } else if (row.Form_Type__c == 'Contact') {
            require(row.Full_Name__c, 'Full name is required.');
            require(row.Email__c, 'Email is required.');
            require(row.Additional_Details__c, 'Please enter a message.');
        } else {
            throw new AuraHandledException('Unsupported form type.');
        }
    }

    private static void require(String value, String message) {
        if (String.isBlank(value)) {
            throw new AuraHandledException(message);
        }
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private static String asMulti(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof List<Object>) {
            List<String> parts = new List<String>();
            for (Object item : (List<Object>) value) {
                if (item != null && String.isNotBlank(String.valueOf(item))) {
                    parts.add(String.valueOf(item).trim());
                }
            }
            return parts.isEmpty() ? null : String.join(parts, '; ');
        }
        return asString(value);
    }
}
