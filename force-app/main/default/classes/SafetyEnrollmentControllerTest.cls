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
}
