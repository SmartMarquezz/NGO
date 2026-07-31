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
            insert enrollment;
        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        }

        return enrollment.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<Safety_Enrollment__c> getEnrollments() {
        return [
            SELECT
                Id,
                Name,
                CreatedDate,
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
                Ethnicity__c,
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
                Status__c
            FROM Safety_Enrollment__c
            WHERE Status__c = 'Submitted'
            ORDER BY CreatedDate DESC
            LIMIT 500
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getDashboardStats() {
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

    private static void validateRequired(Safety_Enrollment__c enrollment) {
        List<String> missing = new List<String>();
        if (String.isBlank(enrollment.Email__c)) {
            missing.add('Email');
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
