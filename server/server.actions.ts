'use server'
import { AssignmentSchema, ClassSchema, EventSchema, ExamSchema, ExpenseSchema, LessonSchema, ResultSchema, StudentSchema, SubjectSchema, TeacherSchema } from "@/lib/FormValidation"
import prisma from "@/lib/prisma";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async ( currentState:CurrentState , data:SubjectSchema) => {
  try {
    const { sessionClaims } = auth();
     const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
   
    await prisma.subject.create({
        data:{
            CollageName:collage,
            name:data.name,
            teachers:{
                connect:data.teachers.map((teacherId) => ({id:teacherId}))            
            }
        }
    })
    return JSON.parse(JSON.stringify({success:true , error:false}));    
  } catch (error) { 
    
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
}
export const updateSubject = async ( currentState:CurrentState , data:SubjectSchema) => {
    try {
       
        await prisma.subject.update({
            where: {
              id: data.id,
            },
            data: {
              name: data.name,
              teachers: {
                set: data.teachers.map((teacherId) => ({ id: teacherId })),
              },
            },
          });


          return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (error) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  }
export const deleteSubject = async ( currentState:CurrentState , data:FormData) => {
    try {
      const id = data.get("id") as string;
      await prisma.subject.delete({
        where: {
          id: parseInt(id),
        },
      }); 
    
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (error) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  } 
 
  export const createTeacher = async (
    currentState: { success: boolean; error: boolean },
    data: TeacherSchema
  ) => {

    const [teacherExists, studentExists] = await Promise.all([
      prisma.teacher.findFirst({
        where: {
          OR: [
            { username: data.username },
            { email: data.email },
          ],
        },
      }),
      prisma.student.findFirst({
        where: {
          OR: [
            { username: data.username },
            { email: data.email },
          ],
        },
      }),
    ]);
  
    if (teacherExists || studentExists) {

      return JSON.parse(JSON.stringify({
        success: false,
        error: true,
        msg: "Email or username already exists",
      }));
    }
 
 
     const { sessionClaims } = auth();
     const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    try { 
      const clerk = clerkClient();  
       
      const user = await clerk.users.createUser({
        username: data.username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "teacher" ,collage:collage},  
        skipPasswordChecks: true,
      });
   
      await prisma.teacher.create({
        data: {
          id: user.id,  
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          img: data.img || null,
          gender: data.gender,
          CollageName:collage,
          subjects: {
            connect: data.subjects?.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });
  
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) {  
      return JSON.parse(JSON.stringify({success: false, error: true , message:err}));  
    }
  };
  
  export const updateTeacher = async (
    currentState: { success: boolean; error: boolean },
    data: TeacherSchema
  ) => {
    if (!data.id) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    } 
  
    try {
      const clerk = clerkClient();
      const user = await clerk.users.getUser(data.id);
      if (!user) { 
        return { success: false, error: false };
      }
  
      await clerk.users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
      });
  
      await prisma.teacher.update({
        where: {
          id: data.id,
        },
        data: {
          ...(data.password !== "" && { password: data.password }),
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          img: data.img || null,
          gender: data.gender,
          subjects: {
            set: data.subjects?.map((subjectId: string) => ({
              id: parseInt(subjectId),
            })),
          },
        },
      });
 
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (error) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };

  export const deleteTeacher = async (
    currentState: CurrentState,
    data: FormData
  ) => {
    const id = data.get("id") as string;
    try {
      await clerkClient.users.deleteUser(id);
  
      await prisma.teacher.delete({
        where: {
          id: id,
        },
      });
   
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  
  export const createStudent = async (
    currentState: CurrentState,
    data: StudentSchema
  ) => { 
    try { 
      const [teacherExists, studentExists] = await Promise.all([
        prisma.teacher.findFirst({
          where: {
            OR: [
              { username: data.username },
              { email: data.email },
            ],
          },
        }),
        prisma.student.findFirst({
          where: {
            OR: [
              { username: data.username },
              { email: data.email },
            ],
          },
        }),
      ]);
    
      if (teacherExists || studentExists) {
        return JSON.parse(JSON.stringify({
          success: false,
          error: true,
          msg: "Email or username already exists",
        }));
      }
      
      const { sessionClaims } = auth();
      const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
      
      const clerk = clerkClient();  
      const classItem  = await prisma.class.findUnique({
        where: { id: data.classId },
        include: { _count: { select: { students: true } } },
      });
  
      if (classItem && classItem.capacity === classItem._count.students) {
        return JSON.parse(JSON.stringify({success: false, error: true}));  
      }
  
      const user = await clerk.users.createUser({
        username: data.username,
        password: data.password,
        firstName: data.name,
        lastName: data.surname,
        publicMetadata:{role:"student" ,collage:collage},
        skipPasswordChecks: true,
      }); 
  
      await prisma.student.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null, 
          phone: data.phone || null, 
          img: data.img || null, 
          gender: data.gender, 
          classId: data.classId,
          batch: data.batch,
          CollageName:collage
        },
      });
   
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) {

      return JSON.parse(JSON.stringify({success: false, error: true, message:err}));  
    }
  };
  
  export const updateStudent = async (
    currentState: CurrentState,
    data: StudentSchema
  ) => {
    if (!data.id) {
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
    try {
      const clerk = clerkClient();
      const user = await clerk.users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
      });
  
      await prisma.student.update({
        where: {
          id: data.id,
        },
        data: {
          ...(data.password !== "" && { password: data.password }),
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null, 
          img: data.img || null, 
          gender: data.gender, 
          classId: data.classId, 
        },
      });  
      
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  
  export const deleteStudent = async (
    currentState: CurrentState,
    data: FormData
  ) => {
    const id = data.get("id") as string;
    try {
      await clerkClient.users.deleteUser(id);
  
      await prisma.student.delete({
        where: {
          id: id,
        },
      });
   
      return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  
  export const createExam = async (
    currentState: CurrentState,
    data: ExamSchema
  ) => {
    try {
      const { sessionClaims } = auth();
     const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
   
     const exam = await prisma.exam.create({
        data: {
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          lessonId: data.lessonId,
          CollageName:collage
        },
      }); 
      
       return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  
  export const updateExam = async (
    currentState: CurrentState,
    data: ExamSchema
  ) => {
  
    try {
   
      await prisma.exam.update({
        where: {
          id: data.id,
        },
        data: {
          title: data.title,
          startTime: data.startTime,
          endTime: data.endTime,
          lessonId: data.lessonId,
        },
      });
       return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  
  export const deleteExam = async (
    currentState: CurrentState,
    data: FormData
  ) => {
    const id = data.get("id") as string;
   
    try {
      await prisma.exam.delete({
        where: {
          id: parseInt(id),
          // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
        },
      });
   
       return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };
  export const deleteLesson = async (
    currentState: CurrentState,
    data: FormData
  ) => {
    const id = data.get("id") as string;
    try {
      await prisma.lesson.delete({
        where: {
          id: parseInt(id),
          // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
        },
      });
   
       return JSON.parse(JSON.stringify({success:true , error:false}));   
    } catch (err) { 
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
  };

  
export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    await prisma.class.create({
      data:{
        id:(data.id),
        name:data.name,
        CollageName:collage,
        supervisorId:(data.supervisorId),
        capacity:(data.capacity)
      }

    });

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) { 
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {

    return JSON.parse(JSON.stringify({success: false, error: true}));   
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) { 
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};


export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
    const { sessionClaims } = auth();
     const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
   
    const event = await prisma.event.create({
      data: {
        title: data.name,  
        startTime: data.startTime,
        endTime: data.endTime,
       
        class: {
          connect: data.class.map((classId: string) => ({ id: parseInt(classId) }))  
        },
        description: data.description,
        CollageName:collage
      },
    });
 

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};
 
export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
     await prisma.event.update({
      where: { id: data.id },  
      data: {
        title: data.name,
        startTime: data.startTime,
        endTime: data.endTime, 
        class: {
          connect: data.class.map((classI: string) => ({ id: parseInt(classI) }))  
        },
        description: data.description,
      },
    }); 

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};
export const deleteEvent = async ( currentState:CurrentState , data:FormData) => {
  try {
    const id = data.get("id") as string;
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    }); 
    return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (error) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
}

export const createAssignment = async (currentState: CurrentState,data: AssignmentSchema) => {
  try {
    const { sessionClaims } = auth();
     const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
   
    const event = await prisma.assignment.create({
      data: {
        title: data.title,  
        startDate: data.startTime,
        dueDate: data.endTime,
        lessonId:  parseInt(data.lessonId) ,
        CollageName:collage
      },
    }); 
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};

export const updateAssignment = async ( currentState: CurrentState, data: AssignmentSchema) => {
  try {
    if (!data.id) {
      return { success: false, error: true, };
    }

    const event = await prisma.assignment.update({
      where: {
        id: data.id ? data.id : undefined
      },
      data: {
        title: data.title,
        startDate: data.startTime,
        dueDate: data.endTime,
        lessonId: data.lessonId ? parseInt(data.lessonId) : undefined,
      },
    }); 
   
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};


export const deleteAssingment = async ( currentState: CurrentState, data: AssignmentSchema) => {
  try {
    if (!data.id) {
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
    const id = data.id;
    await prisma.event.delete({
      where: {
        id,
      },
    }); 
    return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (error) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
}



export const createResults = async (currentState: CurrentState, data: ResultSchema) => {
  try {
    if (!data.score || !data.studentId) {
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    const result = await prisma.result.create({
      data: {
        score: parseInt(data.score), 
        examId: data.studentId ? parseInt(data.studentId) : null, 
        studentId: data.examId,
        CollageName:collage,
      },
    });
     return JSON.parse(JSON.stringify({success:true , error:false}));    
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
};


export const updateResults = async ( currentState: CurrentState, data: ResultSchema) => {
  try {
    if (!data.id) {
      return { success: false, error: true, };
    }

    const event = await prisma.result.update({
      where: {
        id: data.id ? data.id : undefined
      },
      data: {
        score: parseInt(data.score), 
        examId: data.studentId ? parseInt(data.studentId) : null, 
        studentId: data.examId,
      },
    });   
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};

export const deleteResults = async (currentState: CurrentState, data: ResultSchema) => {
  try {
    let id;
    if (data instanceof FormData) {
      id = data.get("id");
    }  
    if (!id) {
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
    const parsedId = parseInt(id as string, 10);
    if (isNaN(parsedId)) {
      return { success: false, error: true};
    }
    await prisma.result.delete({
      where: {
        id: parsedId,  
      },
    });

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (error) { 
    return JSON.parse(JSON.stringify({success: false, error: true}));  
  }
};

export async function getStudentsForLesson(lessonId: number) {
   
  try { 
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;

    const students = await prisma.student.findMany({
      where: {
        CollageName:collage,
       class:{
        lessons:{
          some:{
            id:lessonId
          }
        }
       }
      },
      select: {
        id: true,
        name: true,
        surname: true,
      },
    }); 
    return JSON.parse(JSON.stringify({ success: true, data: students }));
  } catch (error) {

    return JSON.parse(JSON.stringify({ success: false, message: "Failed to fetch students" }));
  }
}

export const resultPie = async (id?:string) => {
  try {
    const user = await currentUser()

     const res = await prisma.result.findMany({
      where: {studentId: id ? id : user?.id},
      select:{
        score:true,
        // include:{
          exam:{
            select:{
              lesson:{ 
                select:{
                name:true
              }}
            }
        },
        assignment:{
          select:{
            title:true,
          }
        }
      }
      })
      return JSON.parse(JSON.stringify(res));
  } catch (error) {
  }
}

export const createLesson = async (currentState: CurrentState, data: LessonSchema) => {

  try {
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    await prisma.lesson.create({
      data:{
        name:data.name,
        startTime:data.startTime,
        endTime:data.endTime,
        subjectId:parseInt(data.subjectId),
        classId:parseInt(data.classId), 
        day:data.day,
        teacherId:data.teacherId,
        CollageName:collage
      }
    });
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
}
export const updateLesson = async (currentState: CurrentState, data: LessonSchema) => {

  try {
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    await prisma.lesson.update({
      where:{
        id:data.id
      },
      data:{
        name:data.name,
        startTime:data.startTime,
        endTime:data.endTime,
        subjectId:parseInt(data.subjectId),
        classId:parseInt(data.classId),
        day:data.day,
        teacherId:data.teacherId,
        CollageName:collage
      }
    });
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
}

export const fetchAttendanceWeekly = async (start:string , end:string) => {
  const { sessionClaims } = auth();
  const collage = (sessionClaims?.metadata as { collage?: string })?.collage;

  if (!start || !end || typeof start !== "string" || typeof end !== "string") {
    return JSON.parse(JSON.stringify({success: false, error: true}));
  }

  try {
    const data = await prisma.attendance.findMany({
      where: {
        CollageName: collage,
        date: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      select: {
        date: true,
        present: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    return JSON.parse(JSON.stringify(data));
  
}
  catch (error) {
    return JSON.parse(JSON.stringify({success: false, error: true}));
  }
}

export const createExpense = async (currentState: CurrentState, data: ExpenseSchema) => {
  try {
    const { userId , sessionClaims } =  auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;

    const user = await prisma.admin.findUnique({
      where: { clerkId: userId! } })

    await prisma.expense.create({
      data:{
        name:data.name,
        amount:data.amount,
        description:data.description,
        date:data.date,
        // date:new Date(),
        CollageName:collage,
        adminId:user?.id!,
      }
    });
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
}
export const updateExpense = async (currentState: CurrentState, data: ExpenseSchema) => {
  try {
    const { sessionClaims } = auth();
    const collage = (sessionClaims?.metadata as { collage?: string })?.collage;
    await prisma.expense.update({
      where:{
        id:data.id
      },
      data:{
        name:data.name,
        amount:data.amount,
        description:data.description,
        date:data.date,
        CollageName:collage
      }
    });
     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
}
export const deleteExpense = async (currentState: CurrentState, data: ExpenseSchema) => {
  try { let id;
    if (data instanceof FormData) {
      id = data.get("id");
    }  
    if (!id) {
      return JSON.parse(JSON.stringify({success: false, error: true}));  
    }
    const parsedId = parseInt(id as string, 10);
    if (isNaN(parsedId)) {
      return { success: false, error: true};
    } 

    await prisma.expense.delete({
      where:{
        id:parsedId
      }
    });

     return JSON.parse(JSON.stringify({success:true , error:false}));   
  } catch (err) {
    return JSON.parse(JSON.stringify({success: false, error: true}));    
  }
}
