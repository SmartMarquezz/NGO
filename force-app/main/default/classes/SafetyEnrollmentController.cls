public without sharing class SafetyEnrollmentController {
    public class EnrollmentException extends Exception {
    }

    @AuraEnabled
    public static Id submitEnrollment(String payloadJson) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('Enrollment data is required.');
        }

        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
        Safety_Enrollment__c enrollment = new Safety_Enrollment__c();

        enrollment.Email__c = asString(data.get('email'));
        enrollment.Great_Day__c = asString(data.get('greatDay'));
        enrollment.Class_Date__c = asDate(data.get('classDate'));
        enrollment.Class_Time__c = asString(data.get('classTime'));
        enrollment.Class_Choice__c = asString(data.get('classChoice'));
        enrollment.Delivery_Option__c = asString(data.get('deliveryOption'));
        enrollment.Payment_Status__c = asString(data.get('paymentStatus'));
        if (String.isBlank(enrollment.Payment_Status__c)) {
            enrollment.Payment_Status__c = 'Pending payment setup';
        }
        enrollment.First_Name__c = asString(data.get('firstName'));
        enrollment.Last_Name__c = asString(data.get('lastName'));
        enrollment.Phone__c = asString(data.get('phone'));
        enrollment.Date_of_Birth__c = asDate(data.get('dateOfBirth'));
        enrollment.Group_Name__c = asString(data.get('groupName'));
        enrollment.Profession__c = asString(data.get('profession'));
        enrollment.Street_Address__c = asString(data.get('streetAddress'));
        enrollment.City__c = asString(data.get('city'));
        enrollment.State__c = asString(data.get('state'));
        enrollment.Postal_Code__c = asString(data.get('postalCode'));
        enrollment.Certifying_Agency__c = asString(data.get('certifyingAgency'));
        enrollment.Certifying_Agency_Other__c = asString(data.get('certifyingAgencyOther'));
        enrollment.Ethnicity__c = asMulti(data.get('ethnicity'));
        enrollment.Ethnicity_Other__c = asString(data.get('ethnicityOther'));
        enrollment.Marital_Status__c = asString(data.get('maritalStatus'));
        enrollment.Marital_Status_Other__c = asString(data.get('maritalStatusOther'));
        enrollment.Sex_at_Birth__c = asString(data.get('sexAtBirth'));
        enrollment.Sex_at_Birth_Other__c = asString(data.get('sexAtBirthOther'));
        enrollment.Employment_Status__c = asString(data.get('employmentStatus'));
        enrollment.Employment_Status_Other__c = asString(data.get('employmentStatusOther'));
        enrollment.Highest_Education__c = asString(data.get('highestEducation'));
        enrollment.Highest_Education_Other__c = asString(data.get('highestEducationOther'));
        enrollment.CPR_Previously__c = asString(data.get('cprPreviously'));
        enrollment.Physical_Health__c = asDecimal(data.get('physicalHealth'));
        enrollment.Mental_Health__c = asDecimal(data.get('mentalHealth'));
        enrollment.Emotional_Health__c = asDecimal(data.get('emotionalHealth'));
        enrollment.Social_Network__c = asDecimal(data.get('socialNetwork'));
        enrollment.CPR_Confidence__c = asDecimal(data.get('cprConfidence'));
        enrollment.Nutritional_Choices__c = asDecimal(data.get('nutritionalChoices'));
        enrollment.Overall_Health_Satisfaction__c = asDecimal(data.get('overallHealthSatisfaction'));
        enrollment.Learn_Self_Care__c = asString(data.get('learnSelfCare'));
        enrollment.Self_Care_Peer_Help__c = asString(data.get('selfCarePeerHelp'));
        enrollment.Self_Care_Peer_Other__c = asString(data.get('selfCarePeerOther'));
        enrollment.Status__c = 'Submitted';

        validateRequired(enrollment);
        try {
            enrollment.Contact__c = upsertContact(enrollment);
            // Guest site users cannot always insert with default DML; system mode matches class registration.
            Database.insert(enrollment, AccessLevel.SYSTEM_MODE);
        } catch (EnrollmentException e) {
            AuraHandledException ex = new AuraHandledException(e.getMessage());
            ex.setMessage(e.getMessage());
            throw ex;
        } catch (DmlException e) {
            AuraHandledException ex = new AuraHandledException(e.getDmlMessage(0));
            ex.setMessage(e.getDmlMessage(0));
            throw ex;
        }

        return enrollment.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getOfferings(String offeringType) {
        String typeFilter = String.isBlank(offeringType) ? 'Class' : offeringType.trim();
        List<Training_Offering__c> rows = [
            SELECT
                Id,
                Name,
                Agency__c,
                Offering_Type__c,
                Course_Code_Label__c,
                Student_Access_Code__c,
                Price_Label__c,
                Description__c,
                Seats_Available__c,
                Track_Inventory__c,
                Payment_Link__c,
                Sort_Order__c
            FROM Training_Offering__c
            WHERE Is_Active__c = TRUE AND Offering_Type__c = :typeFilter
            ORDER BY Sort_Order__c NULLS LAST, Name
        ];

        List<Map<String, Object>> result = new List<Map<String, Object>>();
        for (Training_Offering__c row : rows) {
            Boolean track = row.Track_Inventory__c == true;
            Decimal seats = row.Seats_Available__c == null ? 0 : row.Seats_Available__c;
            Boolean available = !track || seats > 0;
            result.add(
                new Map<String, Object>{
                    'id' => row.Id,
                    'name' => row.Name,
                    'agency' => row.Agency__c,
                    'offeringType' => row.Offering_Type__c,
                    'courseCodeLabel' => row.Course_Code_Label__c,
                    'priceLabel' => row.Price_Label__c,
                    'description' => row.Description__c,
                    'seatsAvailable' => seats,
                    'trackInventory' => track,
                    'paymentLink' => row.Payment_Link__c,
                    'available' => available,
                    'label' => buildOfferingLabel(row, available, seats, track)
                }
            );
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> submitClassRegistration(String payloadJson) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('Registration data is required.');
        }

        Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
        Id offeringId = asId(data.get('offeringId'));
        if (offeringId == null) {
            throw new AuraHandledException('Please select a class.');
        }

        Training_Offering__c offering = [
            SELECT
                Id,
                Name,
                Agency__c,
                Student_Access_Code__c,
                Payment_Link__c,
                Seats_Available__c,
                Track_Inventory__c,
                Is_Active__c
            FROM Training_Offering__c
            WHERE Id = :offeringId
            FOR UPDATE
        ];

        if (offering.Is_Active__c != true) {
            throw new AuraHandledException('That class is not currently available.');
        }

        Boolean track = offering.Track_Inventory__c == true;
        Decimal seats = offering.Seats_Available__c == null ? 0 : offering.Seats_Available__c;
        if (track && seats <= 0) {
            throw new AuraHandledException('No seats left for this class. Please choose another option.');
        }

        Safety_Enrollment__c enrollment = new Safety_Enrollment__c();
        enrollment.Email__c = asString(data.get('email'));
        enrollment.Great_Day__c = 'Yes';
        enrollment.Class_Date__c = asDate(data.get('classDate'));
        enrollment.Class_Time__c = asString(data.get('classTime'));
        enrollment.Class_Choice__c = offering.Name;
        enrollment.Delivery_Option__c = asString(data.get('deliveryOption'));
        enrollment.First_Name__c = asString(data.get('firstName'));
        enrollment.Last_Name__c = asString(data.get('lastName'));
        enrollment.Phone__c = asString(data.get('phone'));
        enrollment.Group_Name__c = asString(data.get('groupName'));
        enrollment.Profession__c = asString(data.get('preferredContact'));
        enrollment.Certifying_Agency__c = mapAgencyToPicklist(offering.Agency__c);
        enrollment.Self_Care_Peer_Other__c = asString(data.get('trainingNotes'));
        enrollment.Training_Offering__c = offering.Id;
        enrollment.Confirmation_Code__c = offering.Student_Access_Code__c;
        enrollment.Payment_Link__c = offering.Payment_Link__c;
        enrollment.Payment_Status__c = String.isBlank(offering.Payment_Link__c)
            ? 'Awaiting QuickBooks payment link'
            : 'Payment link sent';
        enrollment.Status__c = 'Submitted';

        validateRequired(enrollment);

        try {
            enrollment.Contact__c = upsertContact(enrollment);
            if (track) {
                offering.Seats_Available__c = seats - 1;
                // Guest license cannot Edit offerings; seat decrement runs in system mode.
                Database.update(offering, AccessLevel.SYSTEM_MODE);
            }
            Database.insert(enrollment, AccessLevel.SYSTEM_MODE);
        } catch (EnrollmentException e) {
            AuraHandledException ex = new AuraHandledException(e.getMessage());
            ex.setMessage(e.getMessage());
            throw ex;
        } catch (DmlException e) {
            AuraHandledException ex = new AuraHandledException(e.getDmlMessage(0));
            ex.setMessage(e.getDmlMessage(0));
            throw ex;
        }

        return new Map<String, Object>{
            'enrollmentId' => enrollment.Id,
            'className' => offering.Name,
            'agency' => offering.Agency__c,
            'confirmationCode' => offering.Student_Access_Code__c,
            'paymentLink' => offering.Payment_Link__c,
            'seatsRemaining' => track ? (seats - 1) : null
        };
    }

    private static String buildOfferingLabel(
        Training_Offering__c row,
        Boolean available,
        Decimal seats,
        Boolean track
    ) {
        List<String> parts = new List<String>();
        if (String.isNotBlank(row.Agency__c)) {
            parts.add(row.Agency__c);
        }
        parts.add(row.Name);
        if (String.isNotBlank(row.Price_Label__c)) {
            parts.add(row.Price_Label__c);
        }
        if (track) {
            parts.add(available ? (String.valueOf(seats.intValue()) + ' seats left') : 'Sold out');
        } else {
            parts.add('Real-time purchase');
        }
        return String.join(parts, ' · ');
    }

    private static Id asId(Object value) {
        if (value == null || String.isBlank(String.valueOf(value))) {
            return null;
        }
        return Id.valueOf(String.valueOf(value));
    }

    private static String mapAgencyToPicklist(String agency) {
        if (String.isBlank(agency)) {
            return null;
        }
        String key = agency.trim().toUpperCase();
        if (key == 'AHA' || key.contains('AMERICAN HEART')) {
            return 'American Heart Association';
        }
        if (key == 'RC' || key == 'ARC' || key.contains('RED CROSS')) {
            return 'American Red Cross';
        }
        if (key == 'ECSI' || key.contains('EMERGENCY CARE')) {
            return 'ECSI (Emergency Care & Safety Institute)';
        }
        if (key == 'HSI' || key.contains('HEALTH & SAFETY')) {
            return 'Other';
        }
        return 'Other';
    }

    @AuraEnabled
    public static Integer backfillContacts() {
        // Link missing Contacts AND push the latest form answers onto each Contact.
        List<Safety_Enrollment__c> rows = [
            SELECT
                Id,
                Email__c,
                Great_Day__c,
                Class_Date__c,
                Class_Time__c,
                Class_Choice__c,
                First_Name__c,
                Last_Name__c,
                Phone__c,
                Date_of_Birth__c,
                Group_Name__c,
                Profession__c,
                Street_Address__c,
                City__c,
                State__c,
                Postal_Code__c,
                Certifying_Agency__c,
                Certifying_Agency_Other__c,
                Ethnicity__c,
                Ethnicity_Other__c,
                Marital_Status__c,
                Sex_at_Birth__c,
                Employment_Status__c,
                Highest_Education__c,
                CPR_Previously__c,
                Physical_Health__c,
                Mental_Health__c,
                Emotional_Health__c,
                Social_Network__c,
                CPR_Confidence__c,
                Nutritional_Choices__c,
                Overall_Health_Satisfaction__c,
                Learn_Self_Care__c,
                Self_Care_Peer_Help__c,
                Self_Care_Peer_Other__c,
                Contact__c,
                CreatedDate
            FROM Safety_Enrollment__c
            WHERE Email__c != NULL
            ORDER BY CreatedDate DESC
            LIMIT 500
        ];

        Integer linkedOrSynced = 0;
        Set<String> seenEmails = new Set<String>();
        List<Safety_Enrollment__c> enrollmentUpdates = new List<Safety_Enrollment__c>();

        for (Safety_Enrollment__c row : rows) {
            String emailKey = row.Email__c.trim().toLowerCase();
            // Newest enrollment wins for Contact field values
            if (!seenEmails.contains(emailKey)) {
                seenEmails.add(emailKey);
                Id contactId = upsertContact(row);
                if (row.Contact__c != contactId) {
                    row.Contact__c = contactId;
                    enrollmentUpdates.add(row);
                }
                linkedOrSynced++;
            } else if (row.Contact__c == null) {
                // Older row still needs a Contact link
                row.Contact__c = upsertContact(row);
                enrollmentUpdates.add(row);
                linkedOrSynced++;
            }
        }

        if (!enrollmentUpdates.isEmpty()) {
            Database.update(enrollmentUpdates, AccessLevel.SYSTEM_MODE);
        }
        return linkedOrSynced;
    }

    @AuraEnabled
    public static Map<String, Object> refreshDashboardStats() {
        // Non-cacheable so the dashboard Refresh button always pulls fresh records.
        return buildDashboardStats();
    }

    @AuraEnabled(cacheable=true)
    public static List<Safety_Enrollment__c> getEnrollments() {
        return [
            SELECT
                Id,
                Name,
                CreatedDate,
                Contact__c,
                Contact__r.Name,
                Email__c,
                Great_Day__c,
                Class_Date__c,
                Class_Time__c,
                First_Name__c,
                Last_Name__c,
                Phone__c,
                Date_of_Birth__c,
                Group_Name__c,
                Profession__c,
                Street_Address__c,
                City__c,
                State__c,
                Postal_Code__c,
                Certifying_Agency__c,
                Certifying_Agency_Other__c,
                Ethnicity__c,
                Ethnicity_Other__c,
                Marital_Status__c,
                Marital_Status_Other__c,
                Sex_at_Birth__c,
                Sex_at_Birth_Other__c,
                Employment_Status__c,
                Employment_Status_Other__c,
                Highest_Education__c,
                Highest_Education_Other__c,
                CPR_Previously__c,
                Physical_Health__c,
                Mental_Health__c,
                Emotional_Health__c,
                Social_Network__c,
                CPR_Confidence__c,
                Nutritional_Choices__c,
                Overall_Health_Satisfaction__c,
                Learn_Self_Care__c,
                Self_Care_Peer_Help__c,
                Self_Care_Peer_Other__c,
                Status__c
            FROM Safety_Enrollment__c
            WHERE Status__c = 'Submitted'
            ORDER BY CreatedDate DESC
            LIMIT 500
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getDashboardStats() {
        return buildDashboardStats();
    }

    private static Map<String, Object> buildDashboardStats() {
        List<Safety_Enrollment__c> enrollments = getEnrollments();

        Map<String, Integer> byAgency = new Map<String, Integer>();
        Map<String, Integer> byEmployment = new Map<String, Integer>();
        Map<String, Integer> byEducation = new Map<String, Integer>();
        Map<String, Integer> byCpr = new Map<String, Integer>();
        Map<String, Integer> bySelfCare = new Map<String, Integer>();
        Map<String, Integer> byState = new Map<String, Integer>();

        Decimal physical = 0;
        Decimal mental = 0;
        Decimal emotional = 0;
        Decimal social = 0;
        Decimal confidence = 0;
        Decimal nutrition = 0;
        Decimal overall = 0;
        Integer rated = 0;

        Integer selfCareYes = 0;
        Integer withContact = 0;
        for (Safety_Enrollment__c e : enrollments) {
            bump(byAgency, e.Certifying_Agency__c);
            bump(byEmployment, e.Employment_Status__c);
            bump(byEducation, e.Highest_Education__c);
            bump(byCpr, e.CPR_Previously__c);
            bump(bySelfCare, e.Learn_Self_Care__c);
            bump(byState, e.State__c);
            if (e.Learn_Self_Care__c == 'Yes') {
                selfCareYes++;
            }
            if (e.Contact__c != null) {
                withContact++;
            }

            if (e.Physical_Health__c != null) {
                physical += e.Physical_Health__c;
                mental += nullToZero(e.Mental_Health__c);
                emotional += nullToZero(e.Emotional_Health__c);
                social += nullToZero(e.Social_Network__c);
                confidence += nullToZero(e.CPR_Confidence__c);
                nutrition += nullToZero(e.Nutritional_Choices__c);
                overall += nullToZero(e.Overall_Health_Satisfaction__c);
                rated++;
            }
        }

        Map<String, Object> readiness = new Map<String, Object>();
        if (rated > 0) {
            readiness.put('physical', (physical / rated).setScale(1));
            readiness.put('mental', (mental / rated).setScale(1));
            readiness.put('emotional', (emotional / rated).setScale(1));
            readiness.put('social', (social / rated).setScale(1));
            readiness.put('confidence', (confidence / rated).setScale(1));
            readiness.put('nutrition', (nutrition / rated).setScale(1));
            readiness.put('overall', (overall / rated).setScale(1));
        }

        return new Map<String, Object>{
            'total' => enrollments.size(),
            'selfCareYes' => selfCareYes,
            'withContact' => withContact,
            'byAgency' => toList(byAgency),
            'byEmployment' => toList(byEmployment),
            'byEducation' => toList(byEducation),
            'byCpr' => toList(byCpr),
            'bySelfCare' => toList(bySelfCare),
            'byState' => toList(byState),
            'readiness' => readiness,
            'recent' => enrollments
        };
    }

    private static Id upsertContact(Safety_Enrollment__c enrollment) {
        if (String.isBlank(enrollment.Email__c)) {
            return null;
        }

        List<Contact> existing = [
            SELECT
                Id,
                FirstName,
                LastName,
                Email,
                Phone,
                MailingStreet,
                MailingCity,
                MailingState,
                MailingPostalCode,
                Description,
                ACP_Form_Activity__c,
                Comment__c
            FROM Contact
            WHERE Email = :enrollment.Email__c
            ORDER BY LastModifiedDate DESC
            LIMIT 1
        ];

        Contact person = existing.isEmpty() ? new Contact() : existing[0];
        applyEnrollmentToContact(person, enrollment);

        try {
            // SYSTEM_MODE required for Experience Cloud guest users creating/updating Contacts.
            if (person.Id == null) {
                Database.SaveResult sr = Database.insert(person, false, AccessLevel.SYSTEM_MODE);
                if (!sr.isSuccess()) {
                    Id matchedId = duplicateMatchId(sr);
                    if (matchedId != null) {
                        person.Id = matchedId;
                        applyEnrollmentToContact(person, enrollment);
                        Database.update(person, AccessLevel.SYSTEM_MODE);
                    } else {
                        throw new EnrollmentException(
                            'Unable to create Contact: ' + sr.getErrors()[0].getMessage()
                        );
                    }
                }
            } else {
                Database.update(person, AccessLevel.SYSTEM_MODE);
            }
        } catch (EnrollmentException e) {
            throw e;
        } catch (DmlException e) {
            throw new EnrollmentException('Unable to create Contact: ' + e.getDmlMessage(0));
        }
        return person.Id;
    }

    private static void applyEnrollmentToContact(Contact person, Safety_Enrollment__c enrollment) {
        person.FirstName = enrollment.First_Name__c;
        person.LastName = enrollment.Last_Name__c;
        person.Email = enrollment.Email__c;
        if (String.isNotBlank(enrollment.Phone__c)) {
            person.Phone = enrollment.Phone__c;
        }
        if (String.isNotBlank(enrollment.Street_Address__c)) {
            person.MailingStreet = enrollment.Street_Address__c;
            person.put('Street_Address__c', enrollment.Street_Address__c);
        }
        if (String.isNotBlank(enrollment.City__c)) {
            person.MailingCity = enrollment.City__c;
            person.put('City_Address__c', enrollment.City__c);
        }
        if (String.isNotBlank(enrollment.State__c)) {
            person.MailingState = enrollment.State__c;
            person.put('State__c', enrollment.State__c);
        }
        if (String.isNotBlank(enrollment.Postal_Code__c)) {
            person.MailingPostalCode = enrollment.Postal_Code__c;
        }
        if (enrollment.Date_of_Birth__c != null) {
            person.put('DOB__c', enrollment.Date_of_Birth__c);
        }
        if (enrollment.Class_Date__c != null) {
            person.put('Class_Date__c', enrollment.Class_Date__c);
        }
        Time classTime = parseClassTime(enrollment.Class_Time__c);
        if (classTime != null) {
            person.put('Class_Time__c', classTime);
        }

        person.put('Are_you_having_a_good_day__c', mapGreatDay(enrollment.Great_Day__c));
        person.put('Have_you_taken_CPR_First_Aid_previously__c', enrollment.CPR_Previously__c);
        person.put('I_feel_my_physical_health_is_adequate__c', scorePick(enrollment.Physical_Health__c));
        person.put('I_feel_my_mental_health_is_adequate__c', scorePick(enrollment.Mental_Health__c));
        person.put('I_feel_my_emotional_health_is_balanced__c', scorePick(enrollment.Emotional_Health__c));
        person.put('I_feel_my_social_network_is_supportive__c', scorePick(enrollment.Social_Network__c));
        person.put('I_feel_confident_to_provide_CPR_if_neede__c', scorePick(enrollment.CPR_Confidence__c));
        person.put('I_feel_I_make_wise_nutritional_choices_f__c', scorePick(enrollment.Nutritional_Choices__c));
        person.put('I_feel_satisfied_with_my_overall_health__c', scorePick(enrollment.Overall_Health_Satisfaction__c));
        person.put('I_want_to_learn_how_Self_Care_improves_o__c', enrollment.Learn_Self_Care__c);
        if (enrollment.Self_Care_Peer_Help__c != null && enrollment.Self_Care_Peer_Help__c != 'Other') {
            person.put('I_feel_a_self_care_supporrt_peer_or_gui__c', enrollment.Self_Care_Peer_Help__c);
        }
        // Existing Contact field labeled "Select the Certifying Agency"
        Set<String> allowedAgencies = new Set<String>{
            'Not Sure',
            'American Heart Association',
            'American Red Cross',
            'ECSI (Emergency Care & Safety Institute)',
            'American Trauma Event Management',
            'National Safety Council',
            'Custom Class',
            'Other'
        };
        if (String.isNotBlank(enrollment.Certifying_Agency__c) && allowedAgencies.contains(enrollment.Certifying_Agency__c)) {
            person.put('I_feel_a_self_care_support_peer_or_gui__c', enrollment.Certifying_Agency__c);
        }
        if (String.isNotBlank(enrollment.Certifying_Agency_Other__c)) {
            person.put('otherSelect_the_Certifying_Agency__c', enrollment.Certifying_Agency_Other__c);
        }
        Set<String> allowedMarital = new Set<String>{ 'Single', 'Married', 'Divorced', 'Widow', 'Other' };
        if (String.isNotBlank(enrollment.Marital_Status__c) && allowedMarital.contains(enrollment.Marital_Status__c)) {
            person.put('Marital_Status__c', enrollment.Marital_Status__c);
        }
        String sex = mapSex(enrollment.Sex_at_Birth__c);
        Set<String> allowedSex = new Set<String>{ 'Male', 'Female', 'Other', 'No_comment' };
        if (String.isNotBlank(sex) && allowedSex.contains(sex)) {
            person.put('Sex_at_birth__c', sex);
        }
        String education = mapEducation(enrollment.Highest_Education__c);
        Set<String> allowedEducation = new Set<String>{
            'High School', 'Associate', 'Certificate', 'Bachelor', 'Master', 'Doctorat'
        };
        if (String.isNotBlank(education) && allowedEducation.contains(education)) {
            person.put('Highest_Education_Level__c', education);
        }
        String employment = mapEmployment(enrollment.Employment_Status__c);
        Set<String> allowedEmployment = new Set<String>{
            'Unemployed', 'FullTime', 'PartTime', 'Student', 'Retired', 'Other'
        };
        if (String.isNotBlank(employment) && allowedEmployment.contains(employment)) {
            person.put('Employment_Status__c', employment);
        }
        if (String.isNotBlank(enrollment.Ethnicity__c)) {
            person.put('Your_ethnicity_check_multiple_as_needed__c', enrollment.Ethnicity__c.replace('; ', ';'));
        }
        if (String.isNotBlank(enrollment.Ethnicity_Other__c)) {
            person.put('Other_Ethnicity__c', enrollment.Ethnicity_Other__c);
        }
        // Only map when the value matches the Contact restricted picklist.
        Set<String> allowedClasses = new Set<String>{
            'BLS CPR - Basic Life Support (Generally for healthcare professionals)',
            'Adult & Pediatric - First Aid & CPR AED',
            'Adult - First Aid & CPR AED',
            'Adult & Pediatric - CPR AED (No First Aid)',
            'Adult - CPR AED (No First Aid)',
            'First Aid only',
            'Pediatric First Aid & CPR AED (Child Care EMSA approved)',
            'Emotional Health Awareness',
            'Physical Fitness for Health'
        };
        if (String.isNotBlank(enrollment.Class_Choice__c) && allowedClasses.contains(enrollment.Class_Choice__c)) {
            person.put('What_Class_Are_You_Taking__c', enrollment.Class_Choice__c);
        }

        String summary =
            'CPR Safety Enrollment received ' +
            Datetime.now().format() +
            '\nName: ' +
            nullToBlank(enrollment.First_Name__c) +
            ' ' +
            nullToBlank(enrollment.Last_Name__c) +
            '\nClass: ' +
            nullToBlank(String.valueOf(enrollment.Class_Date__c)) +
            ' ' +
            nullToBlank(enrollment.Class_Time__c) +
            '\nAgency: ' +
            nullToBlank(enrollment.Certifying_Agency__c) +
            '\nGroup: ' +
            nullToBlank(enrollment.Group_Name__c) +
            '\nProfession: ' +
            nullToBlank(enrollment.Profession__c);
        person.Description = 'All Care Plus Safety Training enrollment contact';
        person.put('Comment__c', summary);
        appendFormActivity(person, 'Full CPR Enrollment', summary);
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

    private static String scorePick(Decimal value) {
        return value == null ? null : String.valueOf(value.intValue());
    }

    private static String mapGreatDay(String value) {
        if (value == 'Need Help') {
            return 'Need_Help';
        }
        return value;
    }

    private static String mapSex(String value) {
        if (value == 'Prefer not to answer') {
            return 'No_comment';
        }
        return value;
    }

    private static String mapEducation(String value) {
        if (value == 'Masters') {
            return 'Master';
        }
        if (value == 'Doctorate') {
            return 'Doctorat';
        }
        return value;
    }

    private static String mapEmployment(String value) {
        if (value == 'Employed Full-Time') {
            return 'FullTime';
        }
        if (value == 'Employed Part-Time') {
            return 'PartTime';
        }
        return value;
    }

    private static Time parseClassTime(String raw) {
        if (String.isBlank(raw)) {
            return null;
        }
        String cleaned = raw.trim().toUpperCase().replace('.', '');
        Boolean pm = cleaned.contains('PM');
        Boolean am = cleaned.contains('AM');
        cleaned = cleaned.replace('AM', '').replace('PM', '').trim();
        List<String> parts = cleaned.split(':');
        if (parts.isEmpty()) {
            return null;
        }
        try {
            Integer hour = Integer.valueOf(parts[0].trim());
            Integer minute = parts.size() > 1 ? Integer.valueOf(parts[1].trim().replaceAll('[^0-9]', '')) : 0;
            if (pm && hour < 12) {
                hour += 12;
            }
            if (am && hour == 12) {
                hour = 0;
            }
            return Time.newInstance(hour, minute, 0, 0);
        } catch (Exception e) {
            return null;
        }
    }

    private static String nullToBlank(String value) {
        return value == null ? '' : value;
    }

    private static Id duplicateMatchId(Database.SaveResult sr) {
        for (Database.Error err : sr.getErrors()) {
            if (err instanceof Database.DuplicateError) {
                Datacloud.DuplicateResult dup = ((Database.DuplicateError) err).getDuplicateResult();
                if (dup == null) {
                    continue;
                }
                for (Datacloud.MatchResult match : dup.getMatchResults()) {
                    for (Datacloud.MatchRecord rec : match.getMatchRecords()) {
                        if (rec.getRecord() != null && rec.getRecord().Id != null) {
                            return rec.getRecord().Id;
                        }
                    }
                }
            }
        }
        return null;
    }

    private static void validateRequired(Safety_Enrollment__c enrollment) {
        List<String> missing = new List<String>();
        if (String.isBlank(enrollment.Email__c)) {
            missing.add('email');
        }
        if (String.isBlank(enrollment.First_Name__c)) {
            missing.add('First Name');
        }
        if (String.isBlank(enrollment.Last_Name__c)) {
            missing.add('Last Name');
        }
        if (!missing.isEmpty()) {
            throw new AuraHandledException('Missing required fields: ' + String.join(missing, ', '));
        }
    }

    private static void bump(Map<String, Integer> counts, String key) {
        if (String.isBlank(key)) {
            return;
        }
        Integer current = counts.containsKey(key) ? counts.get(key) : 0;
        counts.put(key, current + 1);
    }

    private static List<Map<String, Object>> toList(Map<String, Integer> counts) {
        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        for (String key : counts.keySet()) {
            rows.add(new Map<String, Object>{ 'label' => key, 'value' => counts.get(key) });
        }
        return rows;
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
                    parts.add(String.valueOf(item));
                }
            }
            return String.join(parts, ';');
        }
        return String.valueOf(value);
    }

    private static Date asDate(Object value) {
        if (value == null || String.isBlank(String.valueOf(value))) {
            return null;
        }
        return Date.valueOf(String.valueOf(value));
    }

    private static Decimal asDecimal(Object value) {
        if (value == null || String.isBlank(String.valueOf(value))) {
            return null;
        }
        return Decimal.valueOf(String.valueOf(value));
    }

    private static Decimal nullToZero(Decimal value) {
        return value == null ? 0 : value;
    }
}
