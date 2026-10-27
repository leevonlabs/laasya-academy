import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'receptionist')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Faculty compliance audit is restricted to Academy Staff' },
        { status: 401, headers: corsHeaders }
      );
    }
    const { searchParams } = new URL(request.url);
    const currentDate = new Date();
    const defaultMonth = (currentDate.getMonth() + 1).toString();
    const defaultYear = currentDate.getFullYear().toString();

    const monthParam = searchParams.get('month') || defaultMonth;
    const yearParam = searchParams.get('year') || defaultYear;
    const trainerIdParam = searchParams.get('trainerId') || undefined;
    const trainerNameParam = searchParams.get('trainerName') || undefined;

    // 1. Fetch all active Gurus/Trainers
    const trainersSql = `
      SELECT 
        t.id as trainer_id,
        t.profile_id,
        p.full_name,
        p.phone,
        p.email,
        COALESCE(t.avatar_url, p.avatar_url) as avatar_url,
        t.specializations,
        t.display_title,
        t.bio,
        t.is_active
      FROM public.trainers t
      JOIN public.profiles p ON t.profile_id = p.id
      WHERE t.is_active = true
      ORDER BY p.full_name ASC;
    `;
    const trainers = await query<any>(trainersSql);

    // 2. Fetch all batches with course details
    const batchesSql = `
      SELECT 
        b.id as batch_id,
        b.name as batch_name,
        b.course_id,
        c.title as course_title,
        c.category as course_category,
        b.trainer_id,
        b.room_or_hall,
        b.start_time,
        b.end_time
      FROM public.batches b
      JOIN public.courses c ON b.course_id = c.id
      WHERE b.trainer_id IS NOT NULL;

    `;
    const allBatches = await query<any>(batchesSql);

    // 3. Fetch all active enrolled students with batch info
    const studentsSql = `
      SELECT 
        be.batch_id,
        s.id as student_id,
        s.roll_number,
        p.full_name as student_name,
        COALESCE(s.avatar_url, p.avatar_url) as avatar_url,
        COALESCE(s.parent_name, 'Parent / Guardian') as parent_name,
        p.phone as student_phone,
        p.phone as parent_phone
      FROM public.batch_enrollments be
      JOIN public.students s ON be.student_id = s.id
      JOIN public.profiles p ON s.profile_id = p.id
      WHERE be.status = 'active';
    `;
    const allEnrollments = await query<any>(studentsSql);


    // 4. Fetch all video library items shared by Gurus
    const videosSql = `
      SELECT 
        vl.id,
        vl.title,
        vl.category,
        vl.drive_url,
        vl.youtube_url,
        vl.shared_by_type,
        vl.trainer_id,
        vl.trainer_name,
        vl.description,
        vl.event_name,
        vl.event_date,
        vl.target_student_id,
        vl.target_student_name,
        vl.target_student_roll,
        vl.target_students,
        vl.target_student_names,
        vl.target_course_id,
        vl.target_course_title,
        vl.target_batch_id,
        vl.target_batch_name,
        vl.created_at
      FROM public.video_library vl
      WHERE (
        vl.shared_by_type = 'guru' 
        OR vl.category = 'guru_share' 
        OR vl.trainer_id IS NOT NULL
      )
      ORDER BY vl.created_at DESC;
    `;
    const allGuruVideos = await query<any>(videosSql);

    // Filter videos by requested month & year
    const filteredVideos = allGuruVideos.filter((v: any) => {
      const dateStr = v.event_date || v.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (monthParam !== 'all') {
        const m = (d.getMonth() + 1).toString();
        if (m !== monthParam) return false;
      }
      if (yearParam !== 'all') {
        const y = d.getFullYear().toString();
        if (y !== yearParam) return false;
      }
      return true;
    });

    // Helper to test if a video is authored by this trainer
    const isVideoByTrainer = (video: any, trainer: any): boolean => {
      if (video.trainer_id && trainer.trainer_id && video.trainer_id === trainer.trainer_id) {
        return true;
      }
      const vName = (video.trainer_name || '').toLowerCase().trim();
      const tName = (trainer.full_name || '').toLowerCase().trim();
      if (vName && tName && (vName.includes(tName) || tName.includes(vName))) {
        return true;
      }
      return false;
    };

    // Helper to check if a student was targeted in a video
    const isStudentTargeted = (video: any, student: any): boolean => {
      // 1. Direct student ID match
      if (video.target_student_id && video.target_student_id === student.student_id) {
        return true;
      }
      // 2. Direct roll number match
      if (video.target_student_roll && student.roll_number && video.target_student_roll === student.roll_number) {
        return true;
      }
      // 3. Target students JSON array
      if (video.target_students) {
        let list: any[] = [];
        if (Array.isArray(video.target_students)) {
          list = video.target_students;
        } else if (typeof video.target_students === 'string') {
          try {
            list = JSON.parse(video.target_students);
          } catch (_) {
            list = [];
          }
        }
        for (const ts of list) {
          if (!ts) continue;
          if (ts.id && ts.id === student.student_id) return true;
          if (ts.roll_number && student.roll_number && ts.roll_number === student.roll_number) return true;
          if (ts.name && student.student_name && ts.name.toLowerCase() === student.student_name.toLowerCase()) return true;
        }
      }
      // 4. Target student names string
      if (video.target_student_names && student.student_name) {
        if (video.target_student_names.toLowerCase().includes(student.student_name.toLowerCase())) {
          return true;
        }
      }
      return false;
    };

    // Process each Guru
    const gurusCompliance = trainers.map((trainer: any) => {
      // Guru's batches
      const assignedBatches = allBatches.filter((b: any) => b.trainer_id === trainer.trainer_id);
      const batchIds = assignedBatches.map((b: any) => b.batch_id);

      // Distinct courses taught by this trainer
      const courseMap = new Map<string, { id: string; title: string; category: string }>();
      assignedBatches.forEach((b: any) => {
        if (b.course_id && !courseMap.has(b.course_id)) {
          courseMap.set(b.course_id, {
            id: b.course_id,
            title: b.course_title,
            category: b.course_category || 'Arts',
          });
        }
      });
      const courses = Array.from(courseMap.values());

      // Active students enrolled in this Guru's batches (deduplicated by student_id)
      const enrolledStudentRows = allEnrollments.filter((e: any) => batchIds.includes(e.batch_id));
      const studentMap = new Map<string, any>();
      enrolledStudentRows.forEach((row: any) => {
        if (!studentMap.has(row.student_id)) {
          const batch = assignedBatches.find((b: any) => b.batch_id === row.batch_id);
          studentMap.set(row.student_id, {
            ...row,
            course_id: batch?.course_id || null,
            course_title: batch?.course_title || 'Course',
            batch_name: batch?.batch_name || 'Batch',
          });
        }
      });
      const assignedStudents = Array.from(studentMap.values());

      // Filtered videos authored by this Guru
      const trainerVideos = filteredVideos.filter((v: any) => isVideoByTrainer(v, trainer));

      // Separate into received vs missing
      const receivedDisciples: any[] = [];
      const missingDisciples: any[] = [];

      assignedStudents.forEach((student: any) => {
        // Find matching videos for this student
        const matchingVideos = trainerVideos.filter((v: any) => isStudentTargeted(v, student));

        if (matchingVideos.length > 0) {
          const primaryVideo = matchingVideos[0];
          receivedDisciples.push({
            student_id: student.student_id,
            roll_number: student.roll_number,
            student_name: student.student_name,
            avatar_url: student.avatar_url,
            batch_id: student.batch_id,
            batch_name: student.batch_name,
            course_id: student.course_id,
            course_title: student.course_title,
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
            video_id: primaryVideo.id,
            video_title: primaryVideo.title,
            drive_url: primaryVideo.drive_url,
            youtube_url: primaryVideo.youtube_url,
            event_date: primaryVideo.event_date,
            created_at: primaryVideo.created_at,
            category: primaryVideo.category,
            description: primaryVideo.description,
            all_matching_videos: matchingVideos.map((mv: any) => ({
              id: mv.id,
              title: mv.title,
              drive_url: mv.drive_url,
              youtube_url: mv.youtube_url,
              event_date: mv.event_date,
              created_at: mv.created_at,
            })),
          });
        } else {
          missingDisciples.push({
            student_id: student.student_id,
            roll_number: student.roll_number,
            student_name: student.student_name,
            avatar_url: student.avatar_url,
            batch_id: student.batch_id,
            batch_name: student.batch_name,
            course_id: student.course_id,
            course_title: student.course_title,
            parent_name: student.parent_name,
            parent_phone: student.parent_phone,
          });
        }
      });

      const totalStudents = assignedStudents.length;
      const receivedCount = receivedDisciples.length;
      const missingCount = missingDisciples.length;
      const complianceRate = totalStudents > 0 ? Math.round((receivedCount / totalStudents) * 100) : 100;

      let complianceStatus: 'completed' | 'partial' | 'pending' | 'no_students' = 'pending';
      if (totalStudents === 0) {
        complianceStatus = 'no_students';
      } else if (receivedCount === totalStudents) {
        complianceStatus = 'completed';
      } else if (receivedCount > 0) {
        complianceStatus = 'partial';
      } else {
        complianceStatus = 'pending';
      }

      return {
        trainer_id: trainer.trainer_id,
        full_name: trainer.full_name,
        display_title: trainer.display_title || 'Faculty Guru',
        phone: trainer.phone,
        email: trainer.email,
        avatar_url: trainer.avatar_url,
        specializations: Array.isArray(trainer.specializations) ? trainer.specializations : [],
        courses,
        assigned_batches_count: assignedBatches.length,
        assigned_batches: assignedBatches.map((b: any) => ({
          id: b.batch_id,
          name: b.batch_name,
          course_title: b.course_title,
        })),
        total_students: totalStudents,
        received_count: receivedCount,
        missing_count: missingCount,
        compliance_rate: complianceRate,
        compliance_status: complianceStatus,
        received_disciples: receivedDisciples,
        missing_disciples: missingDisciples,
        shared_videos_count: trainerVideos.length,
        shared_videos: trainerVideos,
      };
    });

    // Optional trainer filter
    let finalGurus = gurusCompliance;
    if (trainerIdParam) {
      finalGurus = finalGurus.filter((g: any) => g.trainer_id === trainerIdParam);
    } else if (trainerNameParam) {
      const q = trainerNameParam.toLowerCase().trim();
      finalGurus = finalGurus.filter((g: any) => g.full_name.toLowerCase().includes(q));
    }

    // Summary calculations
    const totalGurus = finalGurus.length;
    const completedGurus = finalGurus.filter((g: any) => g.compliance_status === 'completed' && g.total_students > 0).length;
    const partialGurus = finalGurus.filter((g: any) => g.compliance_status === 'partial').length;
    const pendingGurus = finalGurus.filter((g: any) => g.compliance_status === 'pending' && g.total_students > 0).length;

    const totalStudentsAcrossAll = finalGurus.reduce((acc: number, g: any) => acc + g.total_students, 0);
    const totalReceivedAcrossAll = finalGurus.reduce((acc: number, g: any) => acc + g.received_count, 0);
    const totalMissingAcrossAll = finalGurus.reduce((acc: number, g: any) => acc + g.missing_count, 0);
    const overallComplianceRate = totalStudentsAcrossAll > 0 
      ? Math.round((totalReceivedAcrossAll / totalStudentsAcrossAll) * 100) 
      : 100;

    return NextResponse.json({
      success: true,
      month: monthParam,
      year: yearParam,
      summary: {
        total_gurus: totalGurus,
        completed_gurus: completedGurus,
        partial_gurus: partialGurus,
        pending_gurus: pendingGurus,
        total_students: totalStudentsAcrossAll,
        total_received: totalReceivedAcrossAll,
        total_missing: totalMissingAcrossAll,
        overall_compliance_rate: overallComplianceRate,
      },
      gurus: finalGurus,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('GET /api/video-library/guru-compliance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch guru compliance data' },
      { status: 500, headers: corsHeaders }
    );
  }
}
