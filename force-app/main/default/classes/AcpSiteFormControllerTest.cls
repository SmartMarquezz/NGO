@IsTest
private class AcpSiteFormControllerTest {
    @IsTest
    static void submitVolunteerInquiry() {
        Map<String, Object> payload = new Map<String, Object>{
            'fullName' => 'Alex Volunteer',
            'email' => 'alex.volunteer@example.com',
            'phone' => '6505550100',
            'preferredContact' => 'Email',
            'interestAreas' => new List<Object>{ 'General Support: I just want to help where needed most!' },
            'availability' => new List<Object>{ 'Weekends (Saturdays / Sundays)' },
            'additionalDetails' => 'Happy to help at events.'
        };

        Test.startTest();
        Id inquiryId = AcpSiteFormController.submitInquiry('Volunteer', JSON.serialize(payload));
        Test.stopTest();

        Acp_Site_Inquiry__c row = [
            SELECT Form_Type__c, Full_Name__c, Email__c, Status__c, Contact__c
            FROM Acp_Site_Inquiry__c
            WHERE Id = :inquiryId
        ];
        System.assertEquals('Volunteer', row.Form_Type__c);
        System.assertEquals('Alex Volunteer', row.Full_Name__c);
        System.assertEquals('Submitted', row.Status__c);
        System.assertNotEquals(null, row.Contact__c);

        Contact person = [SELECT FirstName, LastName, Email FROM Contact WHERE Id = :row.Contact__c];
        System.assertEquals('Alex', person.FirstName);
        System.assertEquals('Volunteer', person.LastName);
        System.assertEquals('alex.volunteer@example.com', person.Email);
    }

    @IsTest
    static void submitAcceptGrowInquiry() {
        Map<String, Object> payload = new Map<String, Object>{
            'completingAs' => 'I am joining for myself',
            'participantName' => 'Jordan Lee',
            'participantAge' => '29',
            'email' => 'jordan.lee@example.com',
            'phone' => '6505550199',
            'preferredContact' => new List<Object>{ 'Email' },
            'bestCheckInTime' => new List<Object>{ 'Evening (4:30 PM – 7:30 PM)' },
            'focusAreas' => new List<Object>{ 'Personal self-care, lifestyle balance, and wellness habits' },
            'urgency' => 'Exploratory: Gathering information',
            'communityAgreement' => new List<Object>{
                '1. Radical Respect & Privacy',
                '2. Active Presence & Safety',
                '3. Non-Judgmental Space',
                '4. Program Scope Awareness'
            },
            'emergencyAcknowledgment' => 'I understand that Accept & Grow drop-in sessions are not for 24/7 emergency crisis response.'
        };

        Test.startTest();
        Id inquiryId = AcpSiteFormController.submitInquiry('Accept_Grow', JSON.serialize(payload));
        Test.stopTest();

        Acp_Site_Inquiry__c row = [
            SELECT Form_Type__c, Participant_Name__c, Urgency__c, Contact__c
            FROM Acp_Site_Inquiry__c
            WHERE Id = :inquiryId
        ];
        System.assertEquals('Accept_Grow', row.Form_Type__c);
        System.assertEquals('Jordan Lee', row.Participant_Name__c);
        System.assertNotEquals(null, row.Contact__c);
    }

    @IsTest
    static void submitCprInquiry() {
        Map<String, Object> payload = new Map<String, Object>{
            'fullName' => 'Sam Responder',
            'email' => 'sam.responder@example.com',
            'phone' => '6505550111',
            'preferredContact' => 'Email',
            'interestAreas' => new List<Object>{ 'Adult & Pediatric First Aid / CPR / AED', 'Not sure - please recommend' },
            'focusAreas' => new List<Object>{ 'Workplace / job requirement' },
            'availability' => new List<Object>{
                'In-Person (Instructor Led)',
                'First time',
                'Within 2 weeks'
            },
            'additionalDetails' => 'Group/org: Acme School\nNeed card by end of month'
        };

        Test.startTest();
        Id inquiryId = AcpSiteFormController.submitInquiry('CPR_Inquiry', JSON.serialize(payload));
        Test.stopTest();

        Acp_Site_Inquiry__c row = [
            SELECT Form_Type__c, Full_Name__c, Interest_Areas__c, Focus_Areas__c, Contact__c
            FROM Acp_Site_Inquiry__c
            WHERE Id = :inquiryId
        ];
        System.assertEquals('CPR_Inquiry', row.Form_Type__c);
        System.assertEquals('Sam Responder', row.Full_Name__c);
        System.assert(row.Interest_Areas__c.contains('Adult & Pediatric First Aid'));
        System.assert(row.Focus_Areas__c.contains('Workplace'));
        System.assertNotEquals(null, row.Contact__c);
    }

    @IsTest
    static void submitContactUsMessage() {
        Map<String, Object> payload = new Map<String, Object>{
            'firstName' => 'Pat',
            'lastName' => 'Neighbor',
            'email' => 'pat.neighbor@example.com',
            'phone' => '6505550122',
            'topic' => 'Peer Support',
            'preferredContact' => 'Email',
            'additionalDetails' => 'Need help at a neighborhood fair next month.'
        };

        Test.startTest();
        Id inquiryId = AcpSiteFormController.submitInquiry('Contact', JSON.serialize(payload));
        Test.stopTest();

        Acp_Site_Inquiry__c row = [
            SELECT Form_Type__c, Full_Name__c, Interest_Areas__c, Additional_Details__c, Contact__c
            FROM Acp_Site_Inquiry__c
            WHERE Id = :inquiryId
        ];
        System.assertEquals('Contact', row.Form_Type__c);
        System.assertEquals('Pat Neighbor', row.Full_Name__c);
        System.assertEquals('Peer Support', row.Interest_Areas__c);
        System.assert(row.Additional_Details__c.contains('neighborhood fair'));
        System.assertNotEquals(null, row.Contact__c);
        Contact person = [SELECT FirstName, LastName FROM Contact WHERE Id = :row.Contact__c];
        System.assertEquals('Pat', person.FirstName);
        System.assertEquals('Neighbor', person.LastName);
    }
}
