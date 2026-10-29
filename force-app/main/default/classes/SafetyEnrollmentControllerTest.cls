@IsTest
private class SafetyEnrollmentControllerTest {
    @IsTest
    static void submitAndLoadDashboard() {
        Map<String, Object> payload = new Map<String, Object>{
            'email' => 'student@example.com',
            'greatDay' => 'Yes',
            'classDate' => String.valueOf(Date.today()),
            'classTime' => '10:00 AM',
            'firstName' => 'Alex',
            'lastName' => 'Rivera',
            'phone' => '5551234567',
            'dateOfBirth' => '1990-05-15',
            'groupName' => 'Downtown Clinic',
            'profession' => 'Nurse',
            'streetAddress' => '123 Care Ave',
            'city' => 'Austin',
            'state' => 'TX',
            'postalCode' => '78701',
            'certifyingAgency' => 'American Heart Association',
            'ethnicity' => new List<Object>{ 'Latino', 'Caucasian' },
            'maritalStatus' => 'Single',
            'sexAtBirth' => 'Female',
            'employmentStatus' => 'Employed Full-Time',
            'highestEducation' => 'Bachelor',
            'cprPreviously' => 'Yes',
            'physicalHealth' => 4,
            'mentalHealth' => 5,
            'emotionalHealth' => 4,
            'socialNetwork' => 3,
            'cprConfidence' => 4,
            'nutritionalChoices' => 3,
            'overallHealthSatisfaction' => 2,
            'learnSelfCare' => 'Yes',
            'selfCarePeerHelp' => 'Maybe'
        };

        Test.startTest();
        Id enrollmentId = SafetyEnrollmentController.submitEnrollment(JSON.serialize(payload));
        List<Safety_Enrollment__c> rows = SafetyEnrollmentController.getEnrollments();
        Map<String, Object> stats = SafetyEnrollmentController.getDashboardStats();
        Test.stopTest();

        System.assertNotEquals(null, enrollmentId);
        System.assertEquals(1, rows.size());
        System.assertEquals(1, (Integer) stats.get('total'));
        System.assertNotEquals(null, stats.get('readiness'));

        Safety_Enrollment__c saved = [
            SELECT Contact__c, Email__c FROM Safety_Enrollment__c WHERE Id = :enrollmentId
        ];
        System.assertNotEquals(null, saved.Contact__c);
        Contact person = [
            SELECT
                Email,
                FirstName,
                LastName,
                Are_you_having_a_good_day__c,
                Have_you_taken_CPR_First_Aid_previously__c,
                I_feel_confident_to_provide_CPR_if_neede__c,
                ACP_Form_Activity__c
            FROM Contact
            WHERE Id = :saved.Contact__c
        ];
        System.assertEquals('student@example.com', person.Email);
        System.assertEquals('Alex', person.FirstName);
        System.assertEquals('Yes', person.Are_you_having_a_good_day__c);
        System.assertEquals('Yes', person.Have_you_taken_CPR_First_Aid_previously__c);
        System.assertEquals('4', person.I_feel_confident_to_provide_CPR_if_neede__c);
        System.assert(person.ACP_Form_Activity__c != null && person.ACP_Form_Activity__c.contains('CPR'));
        System.assertEquals(1, (Integer) stats.get('withContact'));

        Map<String, Object> refreshed = SafetyEnrollmentController.refreshDashboardStats();
        System.assertEquals(1, (Integer) refreshed.get('total'));
    }

    @IsTest
    static void submitMatchesExistingContact() {
        Contact existing = new Contact(
            FirstName = 'Sam',
            LastName = 'Lee',
            Email = 'sam.lee@example.com'
        );
        insert existing;

        Map<String, Object> payload = new Map<String, Object>{
            'email' => 'sam.lee@example.com',
            'firstName' => 'Samantha',
            'lastName' => 'Lee',
            'phone' => '5559998888',
            'learnSelfCare' => 'No',
            'cprPreviously' => 'No'
        };

        Test.startTest();
        Id enrollmentId = SafetyEnrollmentController.submitEnrollment(JSON.serialize(payload));
        Test.stopTest();

        Safety_Enrollment__c saved = [SELECT Contact__c FROM Safety_Enrollment__c WHERE Id = :enrollmentId];
        System.assertEquals(existing.Id, saved.Contact__c);
        System.assertEquals(1, [SELECT COUNT() FROM Contact WHERE Email = 'sam.lee@example.com']);
    }

    @IsTest
    static void backfillCreatesContacts() {
        Safety_Enrollment__c orphan = new Safety_Enrollment__c(
            Email__c = 'orphan@example.com',
            First_Name__c = 'Ora',
            Last_Name__c = 'Phan',
            Status__c = 'Submitted'
        );
        insert orphan;

        Test.startTest();
        Integer count = SafetyEnrollmentController.backfillContacts();
        Test.stopTest();

        System.assertEquals(1, count);
        orphan = [SELECT Contact__c FROM Safety_Enrollment__c WHERE Id = :orphan.Id];
        System.assertNotEquals(null, orphan.Contact__c);
    }

    @IsTest
    static void submitRequiresEmail() {
        Boolean failed = false;
        try {
            SafetyEnrollmentController.submitEnrollment(
                JSON.serialize(new Map<String, Object>{ 'firstName' => 'Sam', 'lastName' => 'Lee' })
            );
        } catch (AuraHandledException e) {
            failed = true;
        }
        System.assertEquals(true, failed);
    }

    @IsTest
    static void submitRejectsBlankPayload() {
        Boolean failed = false;
        try {
            SafetyEnrollmentController.submitEnrollment('');
        } catch (AuraHandledException e) {
            failed = true;
        }
        System.assertEquals(true, failed);
    }

    @IsTest
    static void classRegistrationReservesSeatAndReturnsCode() {
        Training_Offering__c offering = new Training_Offering__c(
            Name = 'AHA BLS Provider',
            Agency__c = 'AHA',
            Offering_Type__c = 'Class',
            Student_Access_Code__c = 'AHA-BLS-TEST',
            Payment_Link__c = 'https://example.com/pay-bls',
            Seats_Available__c = 5,
            Track_Inventory__c = true,
            Is_Active__c = true,
            Sort_Order__c = 1,
            Price_Label__c = '$90'
        );
        insert offering;

        Map<String, Object> payload = new Map<String, Object>{
            'offeringId' => offering.Id,
            'email' => 'bls.student@example.com',
            'firstName' => 'Blair',
            'lastName' => 'Nguyen',
            'phone' => '6505550199',
            'preferredContact' => 'Email',
            'deliveryOption' => 'In-Person (Instructor Led)',
            'classDate' => String.valueOf(Date.today().addDays(7)),
            'classTime' => '10:00 AM',
            'groupName' => 'Individual',
            'trainingNotes' => 'Renewal'
        };

        Test.startTest();
        List<Map<String, Object>> offerings = SafetyEnrollmentController.getOfferings('Class');
        Map<String, Object> result = SafetyEnrollmentController.submitClassRegistration(JSON.serialize(payload));
        Test.stopTest();

        System.assertEquals(1, offerings.size());
        System.assertEquals('AHA-BLS-TEST', (String) result.get('confirmationCode'));
        System.assertEquals('https://example.com/pay-bls', (String) result.get('paymentLink'));

        Training_Offering__c updated = [
            SELECT Seats_Available__c FROM Training_Offering__c WHERE Id = :offering.Id
        ];
        System.assertEquals(4, updated.Seats_Available__c);
    }

    @IsTest
    static void guestUserCanSubmitFullEnrollment() {
        List<User> guests = [
            SELECT Id
            FROM User
            WHERE Profile.Name = 'YES-ACP CPR Training Profile'
               OR Username LIKE 'yes_acp_cpr_training%'
            LIMIT 1
        ];
        if (guests.isEmpty()) {
            guests = [
                SELECT Id
                FROM User
                WHERE UserType = 'Guest' AND IsActive = true
                LIMIT 1
            ];
        }
        System.assert(!guests.isEmpty(), 'Expected an Experience Cloud guest user in the org.');

        Map<String, Object> payload = new Map<String, Object>{
            'email' => 'guest.enroll.' + String.valueOf(Crypto.getRandomInteger()) + '@example.com',
            'greatDay' => 'Yes',
            'classDate' => String.valueOf(Date.today().addDays(10)),
            'classTime' => '10:00 AM',
            'firstName' => 'Guest',
            'lastName' => 'Enroll',
            'phone' => '6505557777',
            'dateOfBirth' => '1991-02-02',
            'groupName' => 'Individual',
            'profession' => 'Parent',
            'streetAddress' => '988 Commercial St',
            'city' => 'Palo Alto',
            'state' => 'CA',
            'postalCode' => '94303',
            'certifyingAgency' => 'American Red Cross',
            'maritalStatus' => 'Single',
            'sexAtBirth' => 'Female',
            'employmentStatus' => 'Employed Full-Time',
            'highestEducation' => 'Bachelor',
            'cprPreviously' => 'No',
            'physicalHealth' => '4',
            'mentalHealth' => '4',
            'emotionalHealth' => '4',
            'socialNetwork' => '4',
            'cprConfidence' => '3',
            'nutritionalChoices' => '4',
            'overallHealthSatisfaction' => '2',
            'learnSelfCare' => 'Yes',
            'selfCarePeerHelp' => 'Yes'
        };

        Id enrollmentId;
        System.runAs(guests[0]) {
            Test.startTest();
            enrollmentId = SafetyEnrollmentController.submitEnrollment(JSON.serialize(payload));
            Test.stopTest();
        }

        Safety_Enrollment__c saved = [
            SELECT Id, Contact__c, Email__c, Status__c
            FROM Safety_Enrollment__c
            WHERE Id = :enrollmentId
        ];
        System.assertEquals('Submitted', saved.Status__c);
        System.assertNotEquals(null, saved.Contact__c);
    }
}
