USE [master]
GO
/****** Object:  Database [Qantam]    Script Date: 2023/01/13 09:13:42 ******/
CREATE DATABASE [Qantam]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'Qantam', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\Qantam.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'Qantam_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\Qantam_log.ldf' , SIZE = 139264KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT
GO
ALTER DATABASE [Qantam] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [Qantam].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [Qantam] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [Qantam] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [Qantam] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [Qantam] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [Qantam] SET ARITHABORT OFF 
GO
ALTER DATABASE [Qantam] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [Qantam] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [Qantam] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [Qantam] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [Qantam] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [Qantam] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [Qantam] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [Qantam] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [Qantam] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [Qantam] SET  DISABLE_BROKER 
GO
ALTER DATABASE [Qantam] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [Qantam] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [Qantam] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [Qantam] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [Qantam] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [Qantam] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [Qantam] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [Qantam] SET RECOVERY FULL 
GO
ALTER DATABASE [Qantam] SET  MULTI_USER 
GO
ALTER DATABASE [Qantam] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [Qantam] SET DB_CHAINING OFF 
GO
ALTER DATABASE [Qantam] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [Qantam] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [Qantam] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [Qantam] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'Qantam', N'ON'
GO
ALTER DATABASE [Qantam] SET QUERY_STORE = OFF
GO
USE [Qantam]
GO
/****** Object:  Table [dbo].[Additional_Security]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Additional_Security](
	[Additional_Security_ID] [int] IDENTITY(1,1) NOT NULL,
	[Additional_Security_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Additional_Security] PRIMARY KEY CLUSTERED 
(
	[Additional_Security_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Appointments]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Appointments](
	[Appointments_ID] [int] IDENTITY(1,1) NOT NULL,
	[Location_ID] [int] NOT NULL,
	[Recurrence_ID] [int] NOT NULL,
	[Appointment_Description] [varchar](max) NOT NULL,
	[Appointment_Date] [datetime] NOT NULL,
	[Appointment_Time] [datetime] NOT NULL,
	[Appointment_Reminder] [bit] NOT NULL,
	[Is_Cancelled] [bit] NOT NULL,
	[Cancellation_Reason] [varchar](50) NOT NULL,
	[Invoice_Needed] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Appointments] PRIMARY KEY CLUSTERED 
(
	[Appointments_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Audit_Trail]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Audit_Trail](
	[Audit_Trail_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[User_Action] [varchar](50) NOT NULL,
	[Action_Date] [datetime] NOT NULL,
 CONSTRAINT [PK_Audit_Trail] PRIMARY KEY CLUSTERED 
(
	[Audit_Trail_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Billing_Information]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Billing_Information](
	[Billing_Information_ID] [int] IDENTITY(1,1) NOT NULL,
	[Quoted_Fee] [float] NOT NULL,
	[Actual_Fee] [float] NOT NULL,
	[Billing_Information_Description] [varchar](max) NOT NULL,
	[Admin_Fee] [float] NOT NULL,
	[Base_Fee] [float] NOT NULL,
 CONSTRAINT [PK_Billing_Information] PRIMARY KEY CLUSTERED 
(
	[Billing_Information_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Broker_Contact]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Broker_Contact](
	[Broker_Contact_ID] [int] IDENTITY(1,1) NOT NULL,
	[Broker_Organisation_ID] [int] NOT NULL,
	[Broker_Email] [varchar](50) NOT NULL,
	[Broker_Password] [varchar](max) NOT NULL,
	[Broker_Name] [varchar](50) NOT NULL,
	[Broker_Surname] [varchar](max) NOT NULL,
	[ID_Number] [bigint] NOT NULL,
	[Cell_Number] [bigint] NOT NULL,
	[Is_Active] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Broker_Contact] PRIMARY KEY CLUSTERED 
(
	[Broker_Contact_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Broker_Organisation]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Broker_Organisation](
	[Broker_Organisation_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Broker_Organisation_Name] [varchar](50) NOT NULL,
	[Broker_Organisation_VAT_Number] [varchar](50) NOT NULL,
	[Broker_Organisation_Registration_Number] [varchar](50) NOT NULL,
	[Broker_Organisation_Size] [int] NOT NULL,
	[Is_Active] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Broker_Organisation] PRIMARY KEY CLUSTERED 
(
	[Broker_Organisation_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Building_Slope]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Building_Slope](
	[Building_Slope_ID] [int] IDENTITY(1,1) NOT NULL,
	[Building_Slope] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Building_Slope] PRIMARY KEY CLUSTERED 
(
	[Building_Slope_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Building_Use]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Building_Use](
	[Building_Use_ID] [int] IDENTITY(1,1) NOT NULL,
	[Building_Use] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Building_Use] PRIMARY KEY CLUSTERED 
(
	[Building_Use_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Buildings_Location]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Buildings_Location](
	[Buidlings_Location_ID] [int] IDENTITY(1,1) NOT NULL,
	[Buildings_Location] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Buildings_Location] PRIMARY KEY CLUSTERED 
(
	[Buidlings_Location_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Car_Number]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Car_Number](
	[Car_Number_ID] [int] IDENTITY(1,1) NOT NULL,
	[Car_Number] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Car_Number] PRIMARY KEY CLUSTERED 
(
	[Car_Number_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Car_Use]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Car_Use](
	[Car_Use_ID] [int] IDENTITY(1,1) NOT NULL,
	[Car_Use] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Car_Use] PRIMARY KEY CLUSTERED 
(
	[Car_Use_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Client]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Client](
	[Client_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Policy_Type_ID] [int] NOT NULL,
	[Client_Email] [varchar](50) NOT NULL,
	[Client_Password] [varchar](max) NOT NULL,
	[Client_Name] [varchar](50) NOT NULL,
	[Client_Surname] [varchar](50) NOT NULL,
	[ID_Number] [bigint] NOT NULL,
	[Cell_Number] [bigint] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
	[Is_Active] [bit] NOT NULL,
 CONSTRAINT [PK_Client] PRIMARY KEY CLUSTERED 
(
	[Client_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Comission_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Comission_Type](
	[Comission_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Comission_Type] [varchar](50) NOT NULL,
	[Comission_Percent] [float] NOT NULL,
 CONSTRAINT [PK_Comission_Type] PRIMARY KEY CLUSTERED 
(
	[Comission_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Company]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Company](
	[Company_ID] [int] IDENTITY(1,1) NOT NULL,
	[Location_ID] [int] NOT NULL,
	[Company_Name] [varchar](50) NOT NULL,
	[Company_Size] [int] NOT NULL,
	[Company_Location] [varchar](max) NOT NULL,
	[Company_Contact] [varchar](50) NOT NULL,
	[Company_Email] [varchar](50) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Company] PRIMARY KEY CLUSTERED 
(
	[Company_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Cracks_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Cracks_Type](
	[Cracks_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Cracks_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Cracks_Type] PRIMARY KEY CLUSTERED 
(
	[Cracks_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Daytime_Parking]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Daytime_Parking](
	[Daytime_Parking_ID] [int] IDENTITY(1,1) NOT NULL,
	[Daytime_Parking] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Daytime_Parking] PRIMARY KEY CLUSTERED 
(
	[Daytime_Parking_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk](
	[Domestic_Risk_ID] [int] IDENTITY(1,1) NOT NULL,
	[Marital_Status_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Residence_Information_ID] [int] NOT NULL,
	[Construction_Information_ID] [int] NOT NULL,
	[Detatched_House_ID] [int] NOT NULL,
	[Estates_Complexes_Flats_ID] [int] NOT NULL,
	[Occupancy_ID] [int] NOT NULL,
	[Entrances_ID] [int] NOT NULL,
	[Vehicles_ID] [int] NOT NULL,
	[Windows_ID] [int] NOT NULL,
	[Other_Features_ID] [int] NOT NULL,
	[Additional_Comments] [varchar](max) NOT NULL,
	[Client_Signature] [bit] NOT NULL,
	[Client_Signature_Date] [datetime] NOT NULL,
	[Surveyor_Signature] [bit] NOT NULL,
	[Surveyor_Signature_Date] [datetime] NOT NULL,
	[Has_Photos] [bit] NOT NULL,
	[Survey_Date] [datetime] NOT NULL,
 CONSTRAINT [PK_Domestic_Risk] PRIMARY KEY CLUSTERED 
(
	[Domestic_Risk_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Construction_Information]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Construction_Information](
	[Construction_Information_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Description] [varchar](50) NOT NULL,
	[Roof_Description] [varchar](50) NOT NULL,
	[Is_Thatch_Roof] [bit] NOT NULL,
	[Has_Lighting_Rod] [bit] NOT NULL,
	[Is_Retardent] [bit] NOT NULL,
	[Detatched_Thatch] [bit] NOT NULL,
	[Attatched_To_Main] [bit] NOT NULL,
	[Distance_From_Main] [float] NOT NULL,
 CONSTRAINT [PK_Construction_Information] PRIMARY KEY CLUSTERED 
(
	[Construction_Information_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Detatched_House]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Detatched_House](
	[Detatched_House_ID] [int] IDENTITY(1,1) NOT NULL,
	[Within_Radius_ID] [int] NOT NULL,
	[Property_Adjacent_ID] [int] NOT NULL,
	[Building_Use_ID] [int] NOT NULL,
	[Has_Alarm] [bit] NOT NULL,
	[Activated_When_Empty] [bit] NOT NULL,
	[Response_Company] [varchar](50) NOT NULL,
	[Siren_Only_Alarm] [bit] NOT NULL,
	[Activated_When_Empty_Siren_Only] [bit] NOT NULL,
	[Alarm_Linked_Outbuildings] [bit] NOT NULL,
	[Has_Electric_Gates] [bit] NOT NULL,
	[Has_Walls_Fences] [bit] NOT NULL,
	[Is_Spike_Razer_Electric] [bit] NOT NULL,
	[Full_Perimeter_Electric_Fence] [bit] NOT NULL,
	[Linked_Response_Alarm_Perim] [bit] NOT NULL,
	[Has_Outside_Beams] [bit] NOT NULL,
	[Is_Agriculture_Area] [bit] NOT NULL,
	[Is_Industrial_Area] [bit] NOT NULL,
 CONSTRAINT [PK_Detatched_House] PRIMARY KEY CLUSTERED 
(
	[Detatched_House_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Entrances]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Entrances](
	[Entrances_ID] [int] IDENTITY(1,1) NOT NULL,
	[Entrances_Has_Security_Gates] [bit] NOT NULL,
	[Security_Description] [varchar](max) NOT NULL,
	[Protected_By_Other] [bit] NOT NULL,
	[Other_Description] [varchar](max) NOT NULL,
 CONSTRAINT [PK_DH_Entrances] PRIMARY KEY CLUSTERED 
(
	[Entrances_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Estates_Complexes_Flats]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Estates_Complexes_Flats](
	[Estates_Complexes_Flats_ID] [int] IDENTITY(1,1) NOT NULL,
	[Unit_Type_ID] [int] NOT NULL,
	[Is_Ultra_Secure_Estate] [bit] NOT NULL,
	[Is_TownHouse_Cluster] [bit] NOT NULL,
	[Is_End_Unit] [bit] NOT NULL,
	[Access_Control_Gate] [bit] NOT NULL,
	[Access_Control_with_Guard] [bit] NOT NULL,
	[Has_Guard_Patrol] [bit] NOT NULL,
	[Unit_Has_Alarm] [bit] NOT NULL,
	[Activated_When_Empty] [bit] NOT NULL,
	[Alarm_To_Guard] [bit] NOT NULL,
	[Full_Perimeter_Fence] [bit] NOT NULL,
 CONSTRAINT [PK_DH_Estates_Complexes_Flats] PRIMARY KEY CLUSTERED 
(
	[Estates_Complexes_Flats_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Occupancy]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Occupancy](
	[Occupancy_ID] [int] IDENTITY(1,1) NOT NULL,
	[Occupied__During_Daytime] [bit] NOT NULL,
	[Always_Occupied] [bit] NOT NULL,
	[Has_Business] [bit] NOT NULL,
	[Business_Type] [varchar](50) NOT NULL,
	[Holiday_House_Sitter] [bit] NOT NULL,
	[Empty_Thirty_Days_Year] [bit] NOT NULL,
 CONSTRAINT [PK_DH_Occupancy] PRIMARY KEY CLUSTERED 
(
	[Occupancy_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Other_Features]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Other_Features](
	[Other_Features_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_CCTV] [bit] NOT NULL,
	[Valuables_In_Safe] [bit] NOT NULL,
	[Has_Security_Lights] [bit] NOT NULL,
	[Has_Street_Patrol] [bit] NOT NULL,
	[Portion_Let_Sublet] [bit] NOT NULL,
	[Is_Commune] [bit] NOT NULL,
	[Building_Rennovations] [bit] NOT NULL,
	[Construction_Close] [bit] NOT NULL,
	[Home_Automation] [bit] NOT NULL,
	[Client_Informed] [bit] NOT NULL,
 CONSTRAINT [PK_DH_Other_Features] PRIMARY KEY CLUSTERED 
(
	[Other_Features_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Residence_Information]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Residence_Information](
	[Residence_Information_ID] [int] IDENTITY(1,1) NOT NULL,
	[Years_In_Residence] [int] NOT NULL,
	[Number_Of_Claims] [int] NOT NULL,
	[Type_Of_Claim] [varchar](50) NOT NULL,
	[Years_In_Previous_Residence] [int] NOT NULL,
	[Number_Of_Previous_Claims] [int] NOT NULL,
	[Previous_Claim_Type] [varchar](50) NOT NULL,
	[Previous_Claims_Comments] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Residence_Information] PRIMARY KEY CLUSTERED 
(
	[Residence_Information_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Vehicles]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Vehicles](
	[Vehicles_ID] [int] IDENTITY(1,1) NOT NULL,
	[Number_Of_Vehicles] [int] NOT NULL,
	[Locked_Garage] [bit] NOT NULL,
	[Locked_Garage_Number] [int] NOT NULL,
	[Outside_Behind_Gates] [bit] NOT NULL,
	[Outside_Behind_Gates_Number] [int] NOT NULL,
	[Other_Security] [bit] NOT NULL,
	[Other_Description] [varchar](max) NOT NULL,
 CONSTRAINT [PK_DH_Vehicles] PRIMARY KEY CLUSTERED 
(
	[Vehicles_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Domestic_Risk_Windows]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Domestic_Risk_Windows](
	[Windows_ID] [int] IDENTITY(1,1) NOT NULL,
	[Windows_Protected] [bit] NOT NULL,
	[Window_Protection_ID] [int] NOT NULL,
	[Open_Windows_Protected] [bit] NOT NULL,
	[Open_Window_Protection_ID] [int] NOT NULL,
	[All_Glass_Protected] [bit] NOT NULL,
	[Glass_Protection_Description] [varchar](50) NOT NULL,
	[Is_Glass_Bullet_Proof] [bit] NOT NULL,
 CONSTRAINT [PK_DH_Windows] PRIMARY KEY CLUSTERED 
(
	[Windows_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Electric_Gate_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Electric_Gate_Type](
	[Electric_Gate_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Electric_Gate_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Electric_Gate_Type] PRIMARY KEY CLUSTERED 
(
	[Electric_Gate_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Electricity_Supply]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Electricity_Supply](
	[Electricity_Supply_ID] [int] IDENTITY(1,1) NOT NULL,
	[Electricity_Supply] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Electricity_Supply] PRIMARY KEY CLUSTERED 
(
	[Electricity_Supply_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Employee]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Employee](
	[Employee_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Employee_Type_ID] [int] NOT NULL,
	[Employee_Comission_ID] [int] NOT NULL,
	[Employee_Email] [varchar](50) NOT NULL,
	[Employee_Password] [varchar](max) NOT NULL,
	[Employee_Name] [varchar](50) NOT NULL,
	[Employee_Surname] [varchar](max) NOT NULL,
	[ID_Number] [bigint] NOT NULL,
	[Cell_Number] [bigint] NOT NULL,
	[Is_Active] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Employee] PRIMARY KEY CLUSTERED 
(
	[Employee_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Employee_Commission]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Employee_Commission](
	[Employee_Commission_ID] [int] IDENTITY(1,1) NOT NULL,
	[Valid_From] [datetime] NOT NULL,
	[Valid_To] [datetime] NOT NULL,
	[Commission_Description] [varchar](max) NOT NULL,
	[Commission_Fixed] [bit] NOT NULL,
	[Break_Point_Type] [varchar](50) NOT NULL,
	[Min_Quantity] [int] NOT NULL,
	[Max_Quantity] [int] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Comission_Type_ID] [int] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Employee_Comission] PRIMARY KEY CLUSTERED 
(
	[Employee_Commission_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Employee_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Employee_Type](
	[Employee_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Employee_Role] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Employee_Type] PRIMARY KEY CLUSTERED 
(
	[Employee_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Fireplace_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Fireplace_Type](
	[Fireplace_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Fireplace_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Fireplace_Type] PRIMARY KEY CLUSTERED 
(
	[Fireplace_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Floodline_Location]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Floodline_Location](
	[Floodline_Location_ID] [int] IDENTITY(1,1) NOT NULL,
	[Floodline_Location] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Floodline_Location] PRIMARY KEY CLUSTERED 
(
	[Floodline_Location_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Fuel_Container]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Fuel_Container](
	[Fuel_Container_ID] [int] IDENTITY(1,1) NOT NULL,
	[Fuel_Container] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Fuel_Container] PRIMARY KEY CLUSTERED 
(
	[Fuel_Container_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Gas_Cylinder_Location]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Gas_Cylinder_Location](
	[Gas_Cylinder_Location_ID] [int] IDENTITY(1,1) NOT NULL,
	[Gas_Cylinder_Location] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Gas_Cylinder_Location] PRIMARY KEY CLUSTERED 
(
	[Gas_Cylinder_Location_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Geyser_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Geyser_Type](
	[Geyser_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Geyser_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Geyser_Type] PRIMARY KEY CLUSTERED 
(
	[Geyser_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[House_Keeping_State]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[House_Keeping_State](
	[House_Keeping_State_ID] [int] IDENTITY(1,1) NOT NULL,
	[House_Keeping_State] [varchar](50) NOT NULL,
 CONSTRAINT [PK_House_Keeping_State] PRIMARY KEY CLUSTERED 
(
	[House_Keeping_State_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Housing_Category]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Housing_Category](
	[Housing_Category_ID] [int] IDENTITY(1,1) NOT NULL,
	[Housing_Category] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Housing_Category] PRIMARY KEY CLUSTERED 
(
	[Housing_Category_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Insurer_Contact]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Insurer_Contact](
	[Insurer_Contact_ID] [int] IDENTITY(1,1) NOT NULL,
	[Insurer_Organisation_ID] [int] NOT NULL,
	[Insurer_Email] [varchar](50) NOT NULL,
	[Insurer_Password] [varchar](max) NOT NULL,
	[Insurer_Name] [varchar](50) NOT NULL,
	[Insurer_Surname] [varchar](max) NOT NULL,
	[ID_Number] [bigint] NOT NULL,
	[Cell_Number] [bigint] NOT NULL,
	[Is_Active] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Insurer_Contact] PRIMARY KEY CLUSTERED 
(
	[Insurer_Contact_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Insurer_Organisation]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Insurer_Organisation](
	[Insurer_Organisation_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Insurer_Organisation_Name] [varchar](50) NOT NULL,
	[Insurer_Organisation_VAT_Number] [varchar](50) NOT NULL,
	[Insurer_Organisation_Registration_Number] [varchar](50) NOT NULL,
	[Is_Active] [bit] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Insurer_Organisation] PRIMARY KEY CLUSTERED 
(
	[Insurer_Organisation_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory](
	[Inventory_ID] [int] IDENTITY(1,1) NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Agreed_Value_Items_ID] [int] NOT NULL,
	[Replacement_Value_Items_ID] [int] NOT NULL,
	[Sum_Insured] [float] NOT NULL,
	[Survey_Description] [varchar](50) NOT NULL,
	[Survey_Date] [datetime] NOT NULL,
	[Is_Claim] [bit] NOT NULL,
	[Is_Renewal] [bit] NOT NULL,
	[Client_Request] [bit] NOT NULL,
 CONSTRAINT [PK_Inventory] PRIMARY KEY CLUSTERED 
(
	[Inventory_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Agreed_Value_Items]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Agreed_Value_Items](
	[Agreed_Value_Items_ID] [int] IDENTITY(1,1) NOT NULL,
	[Clothing_ID] [int] NOT NULL,
	[Furniture_ID] [int] NOT NULL,
	[Linen_ID] [int] NOT NULL,
	[Luggage_Containers_ID] [int] NOT NULL,
	[Jewelry_ID] [int] NOT NULL,
	[Antiques_ID] [int] NOT NULL,
	[Valuable_Artworks_ID] [int] NOT NULL,
	[Valuable_Carpets_ID] [int] NOT NULL,
	[Collections_ID] [int] NOT NULL,
	[Valuable_Ornaments_ID] [int] NOT NULL,
	[Personal_Effects_ID] [int] NOT NULL,
	[Sports_Equipment_ID] [int] NOT NULL,
	[Outdoor_Equipment_ID] [int] NOT NULL,
	[Kitchenware_ID] [int] NOT NULL,
	[Firearms_Bows_ID] [int] NOT NULL,
	[Other_Agreed_Items_ID] [int] NOT NULL,
 CONSTRAINT [PK_Agreed_Value_Items] PRIMARY KEY CLUSTERED 
(
	[Agreed_Value_Items_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Antiques]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Antiques](
	[Antiques_ID] [int] IDENTITY(1,1) NOT NULL,
	[Antiques_Type] [varchar](50) NOT NULL,
	[Antiques_Description] [varchar](max) NOT NULL,
	[Antiques_Quantity] [varchar](50) NOT NULL,
	[Antiques_Price] [float] NOT NULL,
	[Antiques_Total] [float] NOT NULL,
 CONSTRAINT [PK_Antiques] PRIMARY KEY CLUSTERED 
(
	[Antiques_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Clothing]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Clothing](
	[Clothing_ID] [int] IDENTITY(1,1) NOT NULL,
	[Clothing_Gender] [varchar](50) NOT NULL,
	[Clothing_Type] [varchar](50) NOT NULL,
	[Clothing_Quantity] [int] NOT NULL,
	[Clothing_Price] [float] NOT NULL,
	[Clothing_Total] [float] NOT NULL,
	[Clothing_Baby] [varchar](50) NOT NULL,
	[Clothing_Other] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Clothing] PRIMARY KEY CLUSTERED 
(
	[Clothing_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Collections]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Collections](
	[Collections_ID] [int] IDENTITY(1,1) NOT NULL,
	[Collections_Type] [varchar](50) NOT NULL,
	[Collections_Description] [varchar](50) NOT NULL,
	[Collections_Quantity] [int] NOT NULL,
	[Collections_Price] [float] NOT NULL,
	[Collections_Total] [float] NOT NULL,
 CONSTRAINT [PK_Collections] PRIMARY KEY CLUSTERED 
(
	[Collections_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Domestic_Appliances]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Domestic_Appliances](
	[Domestic_Appliances_ID] [int] IDENTITY(1,1) NOT NULL,
	[Domestic_Appliances_Type] [varchar](50) NOT NULL,
	[Domestic_Appliances_Make] [varchar](50) NOT NULL,
	[Domestic_Appliances_Model] [varchar](50) NOT NULL,
	[Domestic_Appliances_Description] [varchar](max) NOT NULL,
	[Domestic_Appliances_Price] [float] NOT NULL,
	[Domestic_Appliances_Total] [float] NOT NULL,
 CONSTRAINT [PK_Domestic_Appliances] PRIMARY KEY CLUSTERED 
(
	[Domestic_Appliances_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Firearms]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Firearms](
	[Firearms_ID] [int] IDENTITY(1,1) NOT NULL,
	[Firearms_Type] [varchar](50) NOT NULL,
	[Firearms_Description] [varchar](50) NOT NULL,
	[Reloading_Equipment] [varchar](50) NOT NULL,
	[Firearms_Quantity] [int] NOT NULL,
	[Ammunition_Type] [varchar](50) NOT NULL,
	[Ammunition_Quantity] [int] NOT NULL,
	[Firearms_Price] [float] NOT NULL,
	[Firearms_Total] [float] NOT NULL,
 CONSTRAINT [PK_Firearms] PRIMARY KEY CLUSTERED 
(
	[Firearms_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Furniture]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Furniture](
	[Furniture_ID] [int] IDENTITY(1,1) NOT NULL,
	[Furniture_Category] [varchar](50) NOT NULL,
	[Furniture_Condition] [varchar](50) NOT NULL,
	[Furniture_Price] [float] NOT NULL,
	[Furniture_Quantity] [numeric](18, 0) NOT NULL,
	[Furniture_Type] [varchar](50) NOT NULL,
	[Furniture_Total] [float] NOT NULL,
 CONSTRAINT [PK_Furniture] PRIMARY KEY CLUSTERED 
(
	[Furniture_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_High_Risk_Items]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_High_Risk_Items](
	[High_Risk_Items_ID] [int] IDENTITY(1,1) NOT NULL,
	[High_Risk_Items_Make] [varchar](50) NOT NULL,
	[High_Risk_Items_Model] [varchar](50) NOT NULL,
	[High_Risk_Items_Description] [varchar](max) NOT NULL,
	[High_Risk_Items_Quantity] [int] NOT NULL,
	[High_Risk_Items_Price] [float] NOT NULL,
	[High_Risk_Items_Total] [float] NOT NULL,
 CONSTRAINT [PK_High_Risk_Items] PRIMARY KEY CLUSTERED 
(
	[High_Risk_Items_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Jewelry]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Jewelry](
	[Jewelry_ID] [int] IDENTITY(1,1) NOT NULL,
	[Major_Item] [bit] NOT NULL,
	[Jewelry_Description] [varchar](50) NOT NULL,
	[Jewelry_Type] [varchar](50) NOT NULL,
	[Jewelry_Quantity] [int] NOT NULL,
	[No_Current_Certificate] [bit] NOT NULL,
	[Current_Certificate] [bit] NOT NULL,
	[Jewelry_Price] [float] NOT NULL,
	[Jewelry_Total] [float] NOT NULL,
 CONSTRAINT [PK_Jewelry] PRIMARY KEY CLUSTERED 
(
	[Jewelry_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Kitchenware]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Kitchenware](
	[Kitchenware_ID] [int] IDENTITY(1,1) NOT NULL,
	[Kitchenware_Type] [varchar](50) NOT NULL,
	[Kitchenware_Description] [varchar](50) NOT NULL,
	[Kitchenware_Quantity] [int] NOT NULL,
	[Kitchenware_Price] [float] NOT NULL,
	[Kitchenware_Total] [float] NOT NULL,
 CONSTRAINT [PK_Kitchenware] PRIMARY KEY CLUSTERED 
(
	[Kitchenware_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Linen]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Linen](
	[Linen_ID] [int] IDENTITY(1,1) NOT NULL,
	[Linen_Type] [varchar](50) NOT NULL,
	[Linen_Description] [varchar](50) NOT NULL,
	[Linen_Quantity] [int] NOT NULL,
	[Linen_Price] [float] NOT NULL,
	[Linen_Total] [float] NOT NULL,
 CONSTRAINT [PK_Linen] PRIMARY KEY CLUSTERED 
(
	[Linen_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Luggage_Containers]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Luggage_Containers](
	[Luggage_Container_ID] [int] IDENTITY(1,1) NOT NULL,
	[Luggage_Container_Description] [varchar](50) NOT NULL,
	[Luggage_Container_Quantity] [int] NOT NULL,
	[Luggage_Container_Price] [float] NOT NULL,
	[Luggage_Container_Type] [varchar](50) NOT NULL,
	[Luggage_Container_Total] [float] NOT NULL,
 CONSTRAINT [PK_Luggage_Containers] PRIMARY KEY CLUSTERED 
(
	[Luggage_Container_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Other_Agreed_Items]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Other_Agreed_Items](
	[Other_Agreed_Items_ID] [int] IDENTITY(1,1) NOT NULL,
	[Other_Agreed_Items_Type] [varchar](50) NOT NULL,
	[Other_Agreed_Items_Description] [varchar](50) NOT NULL,
	[Other_Agreed_Items_Quantity] [int] NOT NULL,
	[Other_Agreed_Items_Price] [float] NOT NULL,
	[Other_Agreed_Items_Total] [float] NOT NULL,
 CONSTRAINT [PK_Other_Agreed_Items] PRIMARY KEY CLUSTERED 
(
	[Other_Agreed_Items_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Outdoor_Equipment]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Outdoor_Equipment](
	[Outdoor_Equipment_ID] [int] IDENTITY(1,1) NOT NULL,
	[Outdoor_Equipment_Type] [varchar](50) NOT NULL,
	[Outdoor_Equipment_Description] [varchar](50) NOT NULL,
	[Outdoor_Equipment_Quantity] [int] NOT NULL,
	[Outdoor_Equipment_Price] [float] NOT NULL,
	[Outdoor_Equipment_Total] [float] NOT NULL,
 CONSTRAINT [PK_Outdoor_Equipment] PRIMARY KEY CLUSTERED 
(
	[Outdoor_Equipment_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Personal_Effects]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Personal_Effects](
	[Personal_Effects_ID] [int] IDENTITY(1,1) NOT NULL,
	[Personal_Effects_Type] [varchar](50) NOT NULL,
	[Personal_Effects_Description] [varchar](50) NOT NULL,
	[Personal_Effects_Quantity] [int] NOT NULL,
	[Personal_Effects_Price] [float] NOT NULL,
	[Personal_Effects_Total] [float] NOT NULL,
 CONSTRAINT [PK_Personal_Effects] PRIMARY KEY CLUSTERED 
(
	[Personal_Effects_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Photographic_Equipment]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Photographic_Equipment](
	[Photographic_Equipment_ID] [int] IDENTITY(1,1) NOT NULL,
	[Photographic_Equipment_Type] [varchar](50) NOT NULL,
	[Photographic_Equipment_Make] [varchar](50) NOT NULL,
	[Photographic_Equipment_Model] [varchar](50) NOT NULL,
	[Photographic_Equipment_Description] [varchar](50) NOT NULL,
	[Photographic_Equipment_Quantity] [int] NOT NULL,
	[Photographic_Equipment_Price] [float] NOT NULL,
	[Photographic_Equipment_Total] [float] NOT NULL,
 CONSTRAINT [PK_Photographic_Equipment] PRIMARY KEY CLUSTERED 
(
	[Photographic_Equipment_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Power_Tools]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Power_Tools](
	[Power_Tools_ID] [int] IDENTITY(1,1) NOT NULL,
	[Power_Tools_Type] [varchar](50) NOT NULL,
	[Power_Tools_Make] [varchar](50) NOT NULL,
	[Power_Tools_Model] [varchar](50) NOT NULL,
	[Power_Tools_Description] [varchar](max) NOT NULL,
	[Power_Tools_Quantity] [int] NOT NULL,
	[Power_Tools_Price] [float] NOT NULL,
	[Power_Tools_Total] [float] NOT NULL,
 CONSTRAINT [PK_Power_Tools] PRIMARY KEY CLUSTERED 
(
	[Power_Tools_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Replacement_Value_Items]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Replacement_Value_Items](
	[Replacement_Value_Items_ID] [int] IDENTITY(1,1) NOT NULL,
	[Domestic_Appliances_ID] [int] NOT NULL,
	[Photographic_Equipment_ID] [int] NOT NULL,
	[Power_Tools_ID] [int] NOT NULL,
	[Visual_Sound_Comp_ID] [int] NOT NULL,
	[High_Risk_Items_ID] [int] NOT NULL,
 CONSTRAINT [PK_Replacement_Value_Items] PRIMARY KEY CLUSTERED 
(
	[Replacement_Value_Items_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Sports_Equipment]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Sports_Equipment](
	[Sports_Equipment_ID] [int] IDENTITY(1,1) NOT NULL,
	[Sports_Equipment_Description] [varchar](50) NOT NULL,
	[Sports_Equipment_Type] [varchar](50) NOT NULL,
	[Sports_Equipment_Quantity] [int] NOT NULL,
	[Sports_Equipment_Price] [float] NOT NULL,
	[Sports_Equipment_Total] [float] NOT NULL,
 CONSTRAINT [PK_Sports_Equipment] PRIMARY KEY CLUSTERED 
(
	[Sports_Equipment_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Valuable_Artworks]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Valuable_Artworks](
	[Valuable_Artworks_ID] [int] IDENTITY(1,1) NOT NULL,
	[Valuable_Artworks_Type] [varchar](50) NOT NULL,
	[Valuable_Artworks_Description] [varchar](50) NOT NULL,
	[Valuable_Artworks_Quantity] [int] NOT NULL,
	[Valuable_Artworks_Price] [float] NOT NULL,
	[Valuable_Artworks_Total] [float] NOT NULL,
 CONSTRAINT [PK_Valuable_Artworks] PRIMARY KEY CLUSTERED 
(
	[Valuable_Artworks_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Valuable_Carpets]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Valuable_Carpets](
	[Valuable_Carpets_ID] [int] IDENTITY(1,1) NOT NULL,
	[Valuable_Carpets_Type] [varchar](50) NOT NULL,
	[Valuable_Carpets_Description] [varchar](50) NOT NULL,
	[Valuable_Carpets_Quantity] [int] NOT NULL,
	[Valuable_Carpets_Price] [float] NOT NULL,
	[Valuable_Carpets_Total] [float] NOT NULL,
 CONSTRAINT [PK_Valuable_Carpets] PRIMARY KEY CLUSTERED 
(
	[Valuable_Carpets_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Valuable_Ornaments]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Valuable_Ornaments](
	[Valuable_Ornaments_ID] [int] IDENTITY(1,1) NOT NULL,
	[Valuable_Ornaments_Description] [varchar](50) NOT NULL,
	[Valuable_Ornaments_Type] [varchar](50) NOT NULL,
	[Valuable_Ornaments_Quantity] [int] NOT NULL,
	[Valuable_Ornaments_Price] [float] NOT NULL,
	[Valuable_Ornaments_Total] [float] NOT NULL,
 CONSTRAINT [PK_Valuable_Ornaments] PRIMARY KEY CLUSTERED 
(
	[Valuable_Ornaments_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Inventory_Visual_Sound_Comp]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inventory_Visual_Sound_Comp](
	[Visual_Sound_Comp_ID] [int] IDENTITY(1,1) NOT NULL,
	[Visual_Sound_Comp_Make] [varchar](50) NOT NULL,
	[Visual_Sound_Comp_Model] [varchar](50) NOT NULL,
	[Visual_Sound_Comp_Description] [varchar](max) NOT NULL,
	[Visual_Sound_Comp_Quantity] [int] NOT NULL,
	[Visual_Sound_Comp_Price] [float] NOT NULL,
	[Visual_Sound_Comp_Total] [float] NOT NULL,
 CONSTRAINT [PK_Visual_Sound_Comp] PRIMARY KEY CLUSTERED 
(
	[Visual_Sound_Comp_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Location]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Location](
	[Location_ID] [int] IDENTITY(1,1) NOT NULL,
	[Country] [varchar](50) NOT NULL,
	[Province] [varchar](50) NOT NULL,
	[Address_1] [varchar](50) NOT NULL,
	[Address_2] [varchar](50) NOT NULL,
	[City] [varchar](50) NOT NULL,
	[Code] [int] NOT NULL,
 CONSTRAINT [PK_Location] PRIMARY KEY CLUSTERED 
(
	[Location_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Marital_Status]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Marital_Status](
	[Marital_Status_ID] [int] IDENTITY(1,1) NOT NULL,
	[Marital_Status] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Marital_Status] PRIMARY KEY CLUSTERED 
(
	[Marital_Status_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Open_Window_Protection]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Open_Window_Protection](
	[Open_Window_Protection_ID] [int] IDENTITY(1,1) NOT NULL,
	[Open_Window_Protection_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Open_Window_Protection] PRIMARY KEY CLUSTERED 
(
	[Open_Window_Protection_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Order_Status]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Order_Status](
	[Order_Status_ID] [int] IDENTITY(1,1) NOT NULL,
	[Order_Status] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Order_Type] PRIMARY KEY CLUSTERED 
(
	[Order_Status_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Order_Template]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Order_Template](
	[Order_Template_ID] [int] IDENTITY(1,1) NOT NULL,
	[Order_Template] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Order_Template] PRIMARY KEY CLUSTERED 
(
	[Order_Template_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[Order_ID] [int] IDENTITY(1,1) NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Appointments_ID] [int] NOT NULL,
	[Billing_Information_ID] [int] NOT NULL,
	[Client_ID] [int] NOT NULL,
	[Order_Status_ID] [int] NOT NULL,
	[Order_Template_ID] [int] NOT NULL,
	[Contents_Sum_Insured] [float] NOT NULL,
	[Specified_Insured_Amount] [float] NOT NULL,
	[Unspecified_Insured_Amount] [float] NOT NULL,
	[Prescence_Of_Value] [varchar](50) NOT NULL,
	[Current_Owners] [varchar](max) NOT NULL,
	[Insured_Vehicle_Registration_Number] [varchar](50) NOT NULL,
	[Vehicle_Inspections] [varchar](50) NOT NULL,
	[Is_Complete] [bit] NOT NULL,
	[Requested_By] [varchar](50) NOT NULL,
	[Requested_By_Number] [varchar](50) NOT NULL,
	[Date_Received] [datetime] NOT NULL,
	[Date_Completed] [datetime] NOT NULL,
	[Client_Advised] [bit] NOT NULL,
	[Policy_Renewal] [bit] NOT NULL,
	[Client_Request] [bit] NOT NULL,
	[New_Business] [bit] NOT NULL,
	[Client_Pay] [float] NOT NULL,
	[Broker_Pay] [float] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
	[Reason] [varchar](max) NOT NULL,
	[Special_Instructions] [varchar](max) NOT NULL,
	[Contents_Valuation] [float] NOT NULL,
	[Building_Valuation] [float] NOT NULL,
	[Claims_Postloss] [float] NOT NULL,
 CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED 
(
	[Order_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Overnight_Parking]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Overnight_Parking](
	[Overnight_Parking_ID] [int] IDENTITY(1,1) NOT NULL,
	[Overnight_Parking] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Overnight_Parking] PRIMARY KEY CLUSTERED 
(
	[Overnight_Parking_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Policy_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Policy_Type](
	[Policy_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Policy_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Policy_Type] PRIMARY KEY CLUSTERED 
(
	[Policy_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Pool_Features]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Pool_Features](
	[Pool_Features_ID] [int] IDENTITY(1,1) NOT NULL,
	[Pool_Features] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Pool_Features] PRIMARY KEY CLUSTERED 
(
	[Pool_Features_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Power_Surge_Protection]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Power_Surge_Protection](
	[Power_Surge_Protection_ID] [int] IDENTITY(1,1) NOT NULL,
	[Power_Surge_Protection] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Power_Surge_Protection] PRIMARY KEY CLUSTERED 
(
	[Power_Surge_Protection_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Property_Adjacent]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Property_Adjacent](
	[Property_Adjacent_ID] [int] IDENTITY(1,1) NOT NULL,
	[Property_Adjacent_Type] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Property_Adjacent] PRIMARY KEY CLUSTERED 
(
	[Property_Adjacent_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Property_Condition]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Property_Condition](
	[Property_Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Property_Condition] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Property_Condition] PRIMARY KEY CLUSTERED 
(
	[Property_Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Property_Occupation]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Property_Occupation](
	[Property_Occupation_ID] [int] IDENTITY(1,1) NOT NULL,
	[Property_Occupation] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Property_Occupation] PRIMARY KEY CLUSTERED 
(
	[Property_Occupation_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Recurrence]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Recurrence](
	[Recurrence_ID] [int] IDENTITY(1,1) NOT NULL,
	[Recurrence_Type_ID] [int] NOT NULL,
	[Recurrence_Interval] [int] NOT NULL,
	[Recurrence_Start] [datetime] NOT NULL,
	[Recurrence_End] [datetime] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Recurrence_Type] PRIMARY KEY CLUSTERED 
(
	[Recurrence_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Recurrence_Type]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Recurrence_Type](
	[Recurrence_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Recurrence_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Recurrence_Type_1] PRIMARY KEY CLUSTERED 
(
	[Recurrence_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building](
	[Residential_Building_ID] [int] IDENTITY(1,1) NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Main_Building_ID] [int] NOT NULL,
	[Cottage_Flat_ID] [int] NOT NULL,
	[Staff_Quarters_ID] [int] NOT NULL,
	[Garages_ID] [int] NOT NULL,
	[Lapa_ID] [int] NOT NULL,
	[Patios_Pergola_ID] [int] NOT NULL,
	[Baclonies_ID] [int] NOT NULL,
	[Seperate_Laundry_ID] [int] NOT NULL,
	[Storeroom_ID] [int] NOT NULL,
	[Other_One_ID] [int] NOT NULL,
	[Other_Two_ID] [int] NOT NULL,
	[Other_Three_ID] [int] NOT NULL,
	[Property_Features_ID] [int] NOT NULL,
	[Outdoor_Paving_Tiling_Decking_ID] [int] NOT NULL,
	[Walls_Retaining_Walls_Fencing_ID] [int] NOT NULL,
	[Electric_Fencing_ID] [int] NOT NULL,
	[Photograph_Checklist_ID] [int] NOT NULL,
	[Underwriting_Factors_ID] [int] NOT NULL,
	[Sum_Insured] [float] NOT NULL,
	[Number_Of_Buildings_On_Property] [int] NOT NULL,
	[Number_Of_Photos_Submitted] [int] NOT NULL,
	[Main_Building_Height] [float] NOT NULL,
	[Cellar_Or_Basement] [bit] NOT NULL,
	[Client_Signature] [bit] NOT NULL,
	[Client_Signature_Date] [datetime] NOT NULL,
	[Surveyor_Signature] [bit] NOT NULL,
	[Surveyor_Signature_Date] [datetime] NOT NULL,
	[Residential_Building_Comments] [varchar](max) NOT NULL,
	[Property_Condition_ID] [int] NOT NULL,
	[Tennis_Court_Condition_ID] [int] NOT NULL,
	[Any_Rubbish] [bit] NOT NULL,
	[Building_Slope_ID] [int] NOT NULL,
	[Has_Broken_Windows] [bit] NOT NULL,
	[Drainage_Issues] [bit] NOT NULL,
	[Overloaded_Plugs] [bit] NOT NULL,
	[Date_Of_Survey] [datetime] NOT NULL,
 CONSTRAINT [PK_Residential_Building] PRIMARY KEY CLUSTERED 
(
	[Residential_Building_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Balconies]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Balconies](
	[Balconies_ID] [int] IDENTITY(1,1) NOT NULL,
	[Ballustrading_Type] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Built_In_Braai] [bit] NOT NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Balconies] PRIMARY KEY CLUSTERED 
(
	[Balconies_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Cottage_Flat]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Cottage_Flat](
	[Cottage_Flat_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Window_Frames_Construction] [varchar](50) NOT NULL,
	[Floor_Construction] [varchar](50) NOT NULL,
	[Housing_Category_ID] [int] NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Number_Of_Bathrooms] [int] NOT NULL,
	[Other_Features] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Cottage_Flat] PRIMARY KEY CLUSTERED 
(
	[Cottage_Flat_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Electric_Fence]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Electric_Fence](
	[Electric_Fence_ID] [int] IDENTITY(1,1) NOT NULL,
	[Electric_Fence_Strands] [int] NOT NULL,
	[Electric_Fence_Length] [float] NOT NULL,
	[Electric_Fence_Height] [float] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Electric_Fence] PRIMARY KEY CLUSTERED 
(
	[Electric_Fence_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Garages]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Garages](
	[Garages_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Electric_Garage_Door] [bit] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Garages] PRIMARY KEY CLUSTERED 
(
	[Garages_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Lapa]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Lapa](
	[Lapa_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Sides_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Number_Of_Bathrooms] [int] NOT NULL,
	[Built_In_Braai] [bit] NOT NULL,
	[Other_Features] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Lapa] PRIMARY KEY CLUSTERED 
(
	[Lapa_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Main_Building]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Main_Building](
	[Main_Building_ID] [int] IDENTITY(1,1) NOT NULL,
	[Main_Building_Security_ID] [int] NOT NULL,
	[Main_Building_Features_ID] [int] NOT NULL,
	[Main_Building_Green_Solutions_ID] [int] NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[WIndow_Frames_Construction] [varchar](50) NOT NULL,
	[Flooring_Construction] [varchar](50) NOT NULL,
	[Housing_Category_ID] [int] NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Number_Of_Bathrooms] [int] NOT NULL,
	[Rural_Distance_From_Eskom] [float] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Main_Building] PRIMARY KEY CLUSTERED 
(
	[Main_Building_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_MB_Features]    Script Date: 2023/01/13 09:13:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_MB_Features](
	[Main_Building_Features_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Aircon] [bit] NOT NULL,
	[Number_Of_Aircons] [int] NULL,
	[Has_Temperature_Control] [bit] NOT NULL,
	[Has_Underfloor_Heating] [bit] NOT NULL,
	[Number_Of_Rooms] [int] NULL,
	[Has_Sky_Lights] [bit] NOT NULL,
	[Has_Central_Vacuum] [bit] NOT NULL,
	[Has_Fireplace] [bit] NOT NULL,
	[Fireplace_Type_ID] [int] NOT NULL,
	[Number_Of_Fireplaces] [int] NOT NULL,
	[Has_Built_In_Appliances] [bit] NOT NULL,
	[Appliances_Make] [varchar](50) NULL,
	[Appliances_Model] [varchar](50) NULL,
	[Has_Built_In_Speakers] [bit] NOT NULL,
	[Speakers_Make] [varchar](50) NULL,
	[Speakers_Model] [varchar](50) NULL,
	[Has_Stone_Counter_Tops] [bit] NOT NULL,
	[Stove_Type_ID] [int] NOT NULL,
	[Has_Home_Automation] [bit] NOT NULL,
	[Home_Automation_Make] [varchar](50) NULL,
	[Home_Automation_Model] [varchar](50) NULL,
	[Home_Automation_Cost] [float] NOT NULL,
	[Has_High_Pitched_Roof] [bit] NOT NULL,
	[Has_Chandeliers] [bit] NOT NULL,
	[Number_Of_Geysers] [bit] NOT NULL,
	[Has_Jacuzzi] [bit] NOT NULL,
	[Has_Sauna] [bit] NOT NULL,
	[Has_Steam_Room] [bit] NOT NULL,
	[Other_Features_One] [varchar](max) NULL,
	[Other_Features_Two] [varchar](max) NULL,
 CONSTRAINT [PK_Residentail_Building_Main_Building_Features] PRIMARY KEY CLUSTERED 
(
	[Main_Building_Features_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_MB_Green_Solution]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_MB_Green_Solution](
	[Main_Building_Green_Solutions_ID] [int] IDENTITY(1,1) NOT NULL,
	[Generator_Description] [varchar](max) NOT NULL,
	[Generator_Cost] [float] NOT NULL,
	[UPS_Inverter_Batteries_Description] [varchar](max) NOT NULL,
	[UPS_Inverter_Batteries_Cost] [float] NOT NULL,
	[Solar_Description] [varchar](max) NOT NULL,
	[Solar_Cost] [float] NOT NULL,
	[Septic_Tank_Description] [varchar](max) NOT NULL,
	[Septic_Tank_Cost] [float] NOT NULL,
	[Water_Purification_Description] [varchar](max) NOT NULL,
	[Water_Purification_Cost] [float] NOT NULL,
	[Other_Description] [varchar](max) NOT NULL,
	[Other_Cost] [float] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Main_Building_Green_Solution] PRIMARY KEY CLUSTERED 
(
	[Main_Building_Green_Solutions_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_MB_Security]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_MB_Security](
	[Main_Building_Security_ID] [int] IDENTITY(1,1) NOT NULL,
	[Number_Of_External_Beams] [int] NOT NULL,
	[Number_Of_CCTV_Cameras] [int] NOT NULL,
	[Number_Of_Intercoms] [int] NOT NULL,
	[Number_Of_Biometrics] [int] NOT NULL,
	[Has_Auto_Security_Shutters] [bit] NOT NULL,
	[Has_Spanish_Bars] [bit] NOT NULL,
	[Has_Trellis_Door] [bit] NOT NULL,
	[Has_Window_Shutters] [bit] NOT NULL,
	[Has_Security_Glass] [bit] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Main_Building_Security] PRIMARY KEY CLUSTERED 
(
	[Main_Building_Security_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Other_Features_One]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Other_Features_One](
	[Other_Features_One_ID] [int] IDENTITY(1,1) NOT NULL,
	[Walls_Construction] [varchar](50) NULL,
	[Roof_Construction] [varchar](50) NULL,
	[Window_Frames_Construction] [varchar](50) NULL,
	[Flooring_Construction] [varchar](50) NULL,
	[Housing_Category_ID] [int] NULL,
	[Total_Square_Meters] [float] NULL,
	[Plan_ID] [varchar](50) NULL,
	[Number_Of_Bathrooms] [int] NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Other_Features_One] PRIMARY KEY CLUSTERED 
(
	[Other_Features_One_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Other_Features_Three]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Other_Features_Three](
	[Other_Features_Three_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NULL,
	[Roof_Construction] [varchar](50) NULL,
	[Window_Frame_Construction] [varchar](50) NULL,
	[Floor_Construction] [varchar](50) NULL,
	[Housing_Category_ID] [int] NULL,
	[Total_Square_Meters] [float] NULL,
	[Plan_ID] [varchar](50) NULL,
	[Number_Of_Bathrooms] [int] NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Other_Features_Three] PRIMARY KEY CLUSTERED 
(
	[Other_Features_Three_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Other_Features_Two]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Other_Features_Two](
	[Other_Features_Two_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NULL,
	[Roof_Construction] [varchar](50) NULL,
	[Window_Frame_Construction] [varchar](50) NULL,
	[Floor_Construction] [varchar](50) NULL,
	[Housing_Category_ID] [int] NULL,
	[Total_Square_Meters] [float] NULL,
	[Plan_ID] [varchar](50) NULL,
	[Number_Of_Bathrooms] [int] NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Other_Features_Two] PRIMARY KEY CLUSTERED 
(
	[Other_Features_Two_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Outdoor_Paving_Tiling_Decking]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Outdoor_Paving_Tiling_Decking](
	[Outdoor_Paving_Tiling_Decking_ID] [int] IDENTITY(1,1) NOT NULL,
	[Outdoor_Paving_Tiling_Decking_Type] [varchar](50) NOT NULL,
	[Outdoor_Paving_Tiling_Decking_Square_Meters] [float] NOT NULL,
	[Outdoor_Paving_Tiling_Decking_Height] [float] NULL,
 CONSTRAINT [PK_Residential_Building_Outdoor_Paving_Tiling_Decking] PRIMARY KEY CLUSTERED 
(
	[Outdoor_Paving_Tiling_Decking_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Patios_Pergolas]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Patios_Pergolas](
	[Patios_Pergolas_ID] [int] IDENTITY(1,1) NOT NULL,
	[Walls_Sides_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Built_In_Braai] [bit] NOT NULL,
	[Other_Features] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Patios_Pergolas] PRIMARY KEY CLUSTERED 
(
	[Patios_Pergolas_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Photograph_Checklist]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Photograph_Checklist](
	[Photograph_Checklist_ID] [int] IDENTITY(1,1) NOT NULL,
	[Main_House_Outside_Done] [bit] NOT NULL,
	[Pool_Done] [bit] NULL,
	[Generator_Done] [bit] NULL,
	[Jungle_Gym_Done] [bit] NULL,
	[Bathrooms_Done] [bit] NOT NULL,
	[Electric_Gate_Done] [bit] NULL,
	[Chandeliers_Done] [bit] NULL,
	[Tennis_Court_Done] [bit] NULL,
	[Kitchen_Done] [bit] NOT NULL,
	[Patio_Balcony_Done] [bit] NULL,
	[Jacuzzi_Sauna_Done] [bit] NULL,
	[Issues_Done] [bit] NULL,
	[Fireplaces_Done] [bit] NULL,
	[Outbuildings_Done] [bit] NULL,
	[Water_Features_Done] [bit] NULL,
	[Built_In_Braai_Done] [bit] NULL,
	[Wendy_House_Done] [bit] NULL,
	[Water_Tanks_Done] [bit] NULL,
 CONSTRAINT [PK_Residential_Building_Photograph_Checklist] PRIMARY KEY CLUSTERED 
(
	[Photograph_Checklist_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Property_Features]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Property_Features](
	[Property_Features_ID] [int] IDENTITY(1,1) NOT NULL,
	[Electric_Gate_Type_ID] [int] NOT NULL,
	[Electric_Gate_Length] [float] NULL,
	[Pool_Length] [float] NULL,
	[Pool_Features_ID] [int] NOT NULL,
	[Has_Borehole] [bit] NOT NULL,
	[Borehole_Depth] [float] NULL,
	[Has_Water_Tanks] [bit] NOT NULL,
	[Water_Features_Description] [varchar](50) NULL,
	[Graden_Irrigation_Description] [varchar](50) NULL,
	[Has_Wendy_House] [bit] NOT NULL,
	[Wendy_House_Size] [float] NULL,
	[Wendy_House_Construction] [varchar](50) NULL,
	[Has_Jungle_Gym] [bit] NOT NULL,
	[Has_Tennis_Court] [bit] NOT NULL,
	[Tennis_Court_Features_ID] [int] NOT NULL,
	[Has_Carport] [bit] NOT NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Property_Features] PRIMARY KEY CLUSTERED 
(
	[Property_Features_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Seperate_Laundry]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Seperate_Laundry](
	[Seperate_Laundry_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
	[Other_Features] [varchar](max) NULL,
 CONSTRAINT [PK_Residential_Building_Seperate_Laundry] PRIMARY KEY CLUSTERED 
(
	[Seperate_Laundry_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Staff_Quarters]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Staff_Quarters](
	[Staff_Quarters_ID] [int] IDENTITY(1,1) NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Housing_Category_ID] [int] NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Number_Of_Bathrooms] [int] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Staff_Quarters] PRIMARY KEY CLUSTERED 
(
	[Staff_Quarters_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Storeroom]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Storeroom](
	[Storeroom_ID] [int] IDENTITY(1,1) NOT NULL,
	[Walls_Construction] [varchar](50) NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Total_Square_Meters] [float] NOT NULL,
	[Plan_ID] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Residential_Builing_Storeroom] PRIMARY KEY CLUSTERED 
(
	[Storeroom_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_UF_Farms_Smallholdings]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_UF_Farms_Smallholdings](
	[Farms_Smallholdings_ID] [int] IDENTITY(1,1) NOT NULL,
	[Buildings_Location_ID] [int] NOT NULL,
	[Number_Of_Buildings_On_Farm] [int] NOT NULL,
	[Number_Of_Buildings_On_Smallholding] [int] NOT NULL,
	[Has_Firebreak] [bit] NOT NULL,
	[Firebreak_Width] [float] NOT NULL,
	[Firebreak_Type] [varchar](50) NOT NULL,
	[Crops_On_Property] [bit] NOT NULL,
	[Distance_From_Crops_To_Buildings] [float] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Underwriting_Factors_Farms_Smallholdings] PRIMARY KEY CLUSTERED 
(
	[Farms_Smallholdings_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_UF_Fire]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_UF_Fire](
	[Fire_ID] [int] IDENTITY(1,1) NOT NULL,
	[Power_Surge_Protection] [bit] NOT NULL,
	[Electricity_Supply_ID] [int] NOT NULL,
	[Stove_Type_ID] [int] NOT NULL,
	[Gas_Cylinder_Location_ID] [int] NOT NULL,
	[Cylinder_Service_Period] [int] NOT NULL,
	[Extractor_Above_Stove] [bit] NOT NULL,
	[Cleaning_Period] [int] NOT NULL,
	[Has_Built_In_Braai] [bit] NOT NULL,
	[Braai_Location] [varchar](50) NOT NULL,
	[Braai_Chimney_Length] [float] NOT NULL,
	[Has_Fireplace] [bit] NOT NULL,
	[Fireplace_Location] [varchar](50) NOT NULL,
	[Fireplace_Chimeny_Length] [float] NOT NULL,
	[Firewood_Inside_Or_Nearby] [bit] NOT NULL,
	[Firewood_Location] [varchar](50) NOT NULL,
	[Any_Flammables] [bit] NOT NULL,
	[Flammables_Description] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Underwriting_Factors_Fire] PRIMARY KEY CLUSTERED 
(
	[Fire_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_UF_Subsidence_Landslip]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_UF_Subsidence_Landslip](
	[Subsidence_Landslip_ID] [int] IDENTITY(1,1) NOT NULL,
	[Built_On_Clay] [bit] NOT NULL,
	[Subsidence_History] [bit] NOT NULL,
	[Cracks_Type_ID] [int] NOT NULL,
	[Cracks_Location] [varchar](max) NOT NULL,
	[Alterations_In_Past_Two_Years] [bit] NOT NULL,
	[Alterations_Description] [varchar](50) NOT NULL,
	[Mining_Nearby] [bit] NOT NULL,
	[Mining_Description] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Underwriting_Factors_Subsidence_Landslip] PRIMARY KEY CLUSTERED 
(
	[Subsidence_Landslip_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_UF_Thatch]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_UF_Thatch](
	[Thatch_ID] [int] IDENTITY(1,1) NOT NULL,
	[Is_Main_Thatch] [bit] NOT NULL,
	[Other_Thatch_Structures] [bit] NOT NULL,
	[Distance_To_Main] [float] NOT NULL,
	[Is_Thatch_Retardent] [bit] NOT NULL,
	[Year_Of_Treatment] [datetime] NOT NULL,
	[Certificate_Available] [bit] NOT NULL,
	[Has_SABS_Lightning_Conductor] [bit] NOT NULL,
	[Lightning_Certificate_Available] [bit] NOT NULL,
	[Thatch_Water_Sprinkler] [bit] NOT NULL,
	[Water_Source] [varchar](50) NOT NULL,
	[Has_Fire_Extinguiser] [bit] NOT NULL,
	[Last_Service_Date] [datetime] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Underwriting_Factors_Thatch] PRIMARY KEY CLUSTERED 
(
	[Thatch_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_UF_Water]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_UF_Water](
	[Water_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Gutters] [bit] NOT NULL,
	[Gutters_Clear] [bit] NOT NULL,
	[Gutter_Cleaning_Period] [int] NOT NULL,
	[Geyser_Type_ID] [int] NOT NULL,
	[All_Overflow_Trays_Fitted] [bit] NOT NULL,
	[Near_Watercourse] [bit] NOT NULL,
	[Watercourse_Distance] [float] NOT NULL,
	[Floodline_Location_ID] [int] NOT NULL,
	[Stain_Location_ID] [int] NOT NULL,
	[Stain_Description] [varchar](50) NOT NULL,
	[Signs_Of_Damp] [bit] NOT NULL,
	[Damp_Type] [varchar](50) NOT NULL,
	[Damp_Description] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Residential_Building_Underwriting_Factors_Water] PRIMARY KEY CLUSTERED 
(
	[Water_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Underwriting_Factors]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Underwriting_Factors](
	[Underwriting_Factors_ID] [int] IDENTITY(1,1) NOT NULL,
	[Farms_Smallholdings_ID] [int] NOT NULL,
	[Thatch_ID] [int] NOT NULL,
	[Fire_ID] [int] NOT NULL,
	[Water_ID] [int] NOT NULL,
	[Subsidence_Landslip_ID] [int] NOT NULL,
	[Building_Use_ID] [int] NOT NULL,
	[If_Office_Describe] [varchar](max) NOT NULL,
	[Building_Age] [int] NOT NULL,
	[Unoccupied_Thirty_Days] [bit] NOT NULL,
	[Property_Occupation_ID] [int] NOT NULL,
	[Building_Activity_Nearby] [bit] NOT NULL,
	[Empty_Adjacent_Stands] [bit] NOT NULL,
	[Within_Radius_ID] [int] NOT NULL,
	[Has_Invasive_Roots] [bit] NOT NULL,
	[Has_Rubber_Trees] [bit] NOT NULL,
	[Rubber_Tree_Comments] [varchar](max) NULL,
 CONSTRAINT [PK_Underwriting_Factors] PRIMARY KEY CLUSTERED 
(
	[Underwriting_Factors_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Building_Walls_Retaining_Walls_Fences]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Building_Walls_Retaining_Walls_Fences](
	[Walls_Retaining_Walls_Fences_ID] [int] IDENTITY(1,1) NOT NULL,
	[Walls_Retaining_Walls_Fences_Type] [varchar](50) NOT NULL,
	[Walls_Retaining_Walls_Fences_Length] [float] NOT NULL,
	[Walls_Retaining_Walls_Fences_Height] [float] NOT NULL,
 CONSTRAINT [PK_Residential_Building_Walls_Retaining_Walls_Fences] PRIMARY KEY CLUSTERED 
(
	[Walls_Retaining_Walls_Fences_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire](
	[Residential_Risk_Fire_ID] [int] IDENTITY(1,1) NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[General_ID] [int] NOT NULL,
	[Theft_ID] [int] NOT NULL,
	[Thatch_ID] [int] NOT NULL,
	[Fire_ID] [int] NOT NULL,
	[Farms_Smallholdings_ID] [int] NOT NULL,
	[Water_ID] [int] NOT NULL,
	[Subsidence_Landslip_ID] [int] NOT NULL,
	[Property_Condition_ID] [int] NOT NULL,
	[House_Keeping_State_ID] [int] NOT NULL,
	[Tennis_Court_Condition_ID] [int] NOT NULL,
	[Building_Slope_ID] [int] NOT NULL,
	[Survey_Date] [datetime] NOT NULL,
	[Total_Sum] [float] NOT NULL,
	[Client_Signature] [bit] NOT NULL,
	[Client_Signature_Date] [datetime] NOT NULL,
	[Surveyor_Signature] [bit] NOT NULL,
	[Surveyor_Signature_Date] [datetime] NOT NULL,
	[Surveyor_On_Time] [bit] NOT NULL,
	[Client_On_Time] [bit] NOT NULL,
	[Client_Cooperative] [bit] NOT NULL,
	[Cooperation_Description] [varchar](max) NOT NULL,
	[Capacity] [varchar](50) NOT NULL,
	[Client_Comments] [varchar](max) NOT NULL,
	[Overall_Impression] [varchar](max) NOT NULL,
	[Signs_Of_Smoking] [bit] NOT NULL,
	[Smoking_Damage] [varchar](max) NOT NULL,
	[Has_Tennis_Court] [bit] NOT NULL,
	[Rubbish_Around] [bit] NOT NULL,
	[Overloaded_Plugs] [bit] NOT NULL,
	[Drainage_Issues] [bit] NOT NULL,
 CONSTRAINT [PK_Residential_Risk_Fire] PRIMARY KEY CLUSTERED 
(
	[Residential_Risk_Fire_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables](
	[Electricity_Fuel_Flammables_ID] [int] IDENTITY(1,1) NOT NULL,
	[Power_Surge_Protection_ID] [int] NOT NULL,
	[Electricity_Supply__ID] [int] NOT NULL,
	[Electricity_Certificate_Available] [varchar](50) NOT NULL,
	[Has_Generator] [bit] NOT NULL,
	[Generator_Location] [varchar](50) NOT NULL,
	[Fuel_Container_ID] [int] NOT NULL,
	[Stove_Type_ID] [int] NOT NULL,
	[Gas_Cylinder_Location_ID] [int] NOT NULL,
	[Cylinder_Service_Period] [int] NOT NULL,
	[Extractor_Above_Stove] [bit] NOT NULL,
	[Cleaning_Period] [int] NOT NULL,
	[Any_Paraffin_Stoves] [bit] NOT NULL,
	[Any_Flammables] [bit] NOT NULL,
	[Flammables_Description] [varchar](50) NOT NULL,
 CONSTRAINT [PK_ResFR_Electricity_Fuel_Flammables] PRIMARY KEY CLUSTERED 
(
	[Electricity_Fuel_Flammables_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Farms_Smallholdings]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Farms_Smallholdings](
	[Farms_Smallholdings_ID] [int] IDENTITY(1,1) NOT NULL,
	[Buildings_Location_ID] [int] NOT NULL,
	[Number_Buildings_On_Farm] [int] NOT NULL,
	[Number_Buildings_On_Smallholding] [int] NOT NULL,
	[Has_Firebreaks] [bit] NOT NULL,
	[Firebreak_Width] [float] NOT NULL,
	[Firebreak_Type] [varchar](50) NOT NULL,
	[Crops_On_Property] [bit] NOT NULL,
	[Distance_From_Crops_To_Buildings] [float] NOT NULL,
 CONSTRAINT [PK_ResRF_Farms_Smallholdings] PRIMARY KEY CLUSTERED 
(
	[Farms_Smallholdings_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Fire]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Fire](
	[Fire_ID] [int] IDENTITY(1,1) NOT NULL,
	[Electricity_Fuel_Flammables_ID] [int] NOT NULL,
	[Home_Fires_Braais_ID] [int] NOT NULL,
	[Fire_Protection_ID] [int] NOT NULL,
 CONSTRAINT [PK_ResRF_Fire] PRIMARY KEY CLUSTERED 
(
	[Fire_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Fire_Protections]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Fire_Protections](
	[Fire_Protections_ID] [int] IDENTITY(1,1) NOT NULL,
	[Fire_Brigade_Name] [varchar](50) NOT NULL,
	[Fire_Brigade_Distance] [varchar](50) NOT NULL,
	[Number_Of_Firehoses] [int] NOT NULL,
	[Firehose_Last_Service] [datetime] NOT NULL,
	[Number_Of_Fire_Hydrants] [int] NOT NULL,
	[Hydrants_Last_Service] [datetime] NOT NULL,
	[Number_Of_Powder_Hydrants] [int] NULL,
	[Powder_Hydrants_Last_Service] [datetime] NULL,
	[Signs_For_Hose_Hydrants] [bit] NOT NULL,
	[Is_Hose_Hydrant_Accessible] [bit] NOT NULL,
	[Fire_Risk_Policy] [bit] NOT NULL,
	[Employees_Aware] [bit] NOT NULL,
	[Drills_Practice_Period] [int] NOT NULL,
	[Smoking_Permitted] [bit] NOT NULL,
	[Non_Smoking_Signs_Around] [bit] NOT NULL,
 CONSTRAINT [PK_ResRF_Fire_Protections] PRIMARY KEY CLUSTERED 
(
	[Fire_Protections_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_General]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_General](
	[General_ID] [int] IDENTITY(1,1) NOT NULL,
	[Years_In_Residence] [int] NOT NULL,
	[Number_Of_Claims] [int] NOT NULL,
	[Claim_Type] [varchar](50) NOT NULL,
	[Years_In_Previous_Residence] [int] NOT NULL,
	[Previous_Number_Of_Claims] [int] NOT NULL,
	[Previous_Claim_Type] [varchar](50) NOT NULL,
	[Burglary_Prevention_Measures] [varchar](50) NOT NULL,
	[Marital_Status_ID] [int] NOT NULL,
	[Number_Of_Children] [int] NOT NULL,
	[Age_Of_Children] [int] NOT NULL,
	[Building_Use_ID] [int] NOT NULL,
	[Roof_Construction] [varchar](50) NOT NULL,
	[Wall_Construction] [varchar](50) NOT NULL,
	[Property_Occupation_ID] [int] NOT NULL,
	[Age_Of_Buildings] [int] NOT NULL,
	[Size_Of_Buildings] [float] NOT NULL,
	[Has_Rubber_Trees] [bit] NOT NULL,
	[Distance_To_Trees] [float] NOT NULL,
 CONSTRAINT [PK_RRF_General] PRIMARY KEY CLUSTERED 
(
	[General_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Homes_Fires_Braais]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Homes_Fires_Braais](
	[Homes_Fires_Braais_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Built_In_Braai] [bit] NOT NULL,
	[Braai_Location] [varchar](max) NOT NULL,
	[Braai_Chimney_Length] [float] NOT NULL,
	[Fireplace_Inside] [bit] NOT NULL,
	[Fireplace_Chimney_Length] [float] NOT NULL,
	[Fireplace_Inside_Other] [bit] NOT NULL,
	[Other_Chimney_Length] [float] NOT NULL,
	[Firewood_Inside_Or_Nearby] [bit] NOT NULL,
 CONSTRAINT [PK_ResRF_Homes_Fires_Braais] PRIMARY KEY CLUSTERED 
(
	[Homes_Fires_Braais_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Subsidence_Landslip]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Subsidence_Landslip](
	[Subsidence_Landslip_ID] [int] IDENTITY(1,1) NOT NULL,
	[Built_On_Clay] [bit] NOT NULL,
	[Subsidence_History] [bit] NOT NULL,
	[Visible_Structural_Cracks_Description] [varchar](max) NOT NULL,
	[Cracks_Type_ID] [int] NOT NULL,
	[Plaster_Cracks_Description] [varchar](max) NOT NULL,
	[Number_Of_Photos] [int] NOT NULL,
	[Cracks_Around_Pool_Description] [varchar](max) NULL,
	[Repaired_Cracks_Description] [varchar](max) NOT NULL,
	[Adjoining_Property_Damage] [bit] NOT NULL,
	[Damage_Description] [varchar](max) NOT NULL,
	[Alterations_Past_Two_Years] [bit] NOT NULL,
	[Alterations_Description] [varchar](max) NOT NULL,
	[Mining_Nearby] [bit] NOT NULL,
	[Mining_Description] [varchar](max) NOT NULL,
 CONSTRAINT [PK_RRF_Subsidence_Landslip] PRIMARY KEY CLUSTERED 
(
	[Subsidence_Landslip_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Thatch]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Thatch](
	[Thatch_ID] [int] IDENTITY(1,1) NOT NULL,
	[Is_Main_Thatch] [bit] NOT NULL,
	[Other_Thatch_Structures] [bit] NOT NULL,
	[Distance_To_Main] [float] NOT NULL,
	[Is_Thatch_Retardent] [bit] NOT NULL,
	[Year_Of_Treatment] [datetime] NOT NULL,
	[Certificate_Available] [bit] NOT NULL,
	[Has_SABS_Lightning_Conductor] [bit] NOT NULL,
	[Lightning_Certificate_Available] [bit] NOT NULL,
	[Thatch_Water_Sprinkler] [bit] NOT NULL,
	[Water_Source] [varchar](50) NOT NULL,
 CONSTRAINT [PK_ResRF_Thatch] PRIMARY KEY CLUSTERED 
(
	[Thatch_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft](
	[Theft_ID] [int] IDENTITY(1,1) NOT NULL,
	[Theft_Occupancy_ID] [int] NOT NULL,
	[Theft_Surroundings_ID] [int] NOT NULL,
	[Theft_Detatched_House_ID] [int] NOT NULL,
	[Theft_Estates_Complexes_Flats_ID] [int] NOT NULL,
	[Theft_Entrances_Windows_ID] [int] NOT NULL,
 CONSTRAINT [PK_RRF_Theft] PRIMARY KEY CLUSTERED 
(
	[Theft_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft_Detatched_House]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft_Detatched_House](
	[Theft_Detatched_House_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Alarm] [bit] NOT NULL,
	[Activated_When_Empty] [bit] NOT NULL,
	[Response_Company] [varchar](50) NOT NULL,
	[Siren_Only_Alarm] [bit] NOT NULL,
	[Activated_When_Empty_SO] [bit] NOT NULL,
	[Alarm_Linked_Outbuildings] [bit] NOT NULL,
	[Has_Electric_Gates] [bit] NOT NULL,
	[Has_Electric_Fences] [bit] NOT NULL,
	[Is_Spike_Razer_Electric] [bit] NOT NULL,
	[Full_Perim_Electric_Fence] [bit] NOT NULL,
	[Has_Linked_Outside_Beams] [bit] NOT NULL,
	[Linked_Response_Alarm_Perim] [bit] NOT NULL,
 CONSTRAINT [PK_ResRF_Theft_Detatched_House] PRIMARY KEY CLUSTERED 
(
	[Theft_Detatched_House_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows](
	[Theft_Entrances_Windows_ID] [int] IDENTITY(1,1) NOT NULL,
	[Additional_Security_ID] [int] NOT NULL,
	[All_Entrances_Protected_By_Gates] [bit] NOT NULL,
	[Entrances_Protected_By_Other] [bit] NOT NULL,
	[Protected_By_Other_Description] [varchar](max) NULL,
	[Window_Protection] [bit] NOT NULL,
	[Window_Protection_ID] [int] NOT NULL,
	[Opening_Window_Protection] [bit] NOT NULL,
	[Opening_Window_Protection_ID] [int] NOT NULL,
	[Protection_Other] [bit] NOT NULL,
	[Protection_Other_Description] [varchar](max) NULL,
	[Has_Bullet_Proof_Glass] [bit] NOT NULL,
 CONSTRAINT [PK_RRF_Theft_Entrances_Windows] PRIMARY KEY CLUSTERED 
(
	[Theft_Entrances_Windows_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft_Estates_Complexes_Flats]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft_Estates_Complexes_Flats](
	[Theft_Estates_Complexes_Flats_ID] [int] IDENTITY(1,1) NOT NULL,
	[Unit_Type_ID] [int] NOT NULL,
	[Is_Ultra_Secure_Estate] [bit] NOT NULL,
	[Is_Town_House] [bit] NOT NULL,
	[Is_End_Unit] [bit] NOT NULL,
	[Access_Control_Gate] [bit] NOT NULL,
	[Access_Control_Guards] [bit] NOT NULL,
	[Has_Guard_Patrol] [bit] NOT NULL,
	[Unit_Has_Alarm] [bit] NOT NULL,
	[Activated_When_Empty] [bit] NOT NULL,
	[Alarm_To_Guard] [bit] NOT NULL,
	[Response_Company] [varchar](50) NOT NULL,
	[Outside_Beams] [bit] NOT NULL,
	[Full_Perimeter_Fence] [bit] NOT NULL,
 CONSTRAINT [PK_RRF_Theft_Estates_Complexes_Flats] PRIMARY KEY CLUSTERED 
(
	[Theft_Estates_Complexes_Flats_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft_Occupancy]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft_Occupancy](
	[Theft_Occupancy_ID] [int] IDENTITY(1,1) NOT NULL,
	[Occupied_During_Week] [bit] NOT NULL,
	[Always_Occupied] [bit] NOT NULL,
	[Is_Business] [bit] NOT NULL,
	[Business_Description] [varchar](max) NOT NULL,
	[Always_House_Sitter] [bit] NOT NULL,
	[Is_Commune] [bit] NOT NULL,
	[Thirty_Days_Empty] [bit] NOT NULL,
 CONSTRAINT [PK_RRF_Theft_Occupancy] PRIMARY KEY CLUSTERED 
(
	[Theft_Occupancy_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Theft_Surroundings]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Theft_Surroundings](
	[Theft_Surroundings_ID] [int] IDENTITY(1,1) NOT NULL,
	[Building_Activity] [bit] NOT NULL,
	[Has_Rennovations] [bit] NOT NULL,
	[Within_Radius_ID] [int] NOT NULL,
	[Property_Adjacent_ID] [int] NOT NULL,
 CONSTRAINT [PK_RRF_Theft_Surroundings] PRIMARY KEY CLUSTERED 
(
	[Theft_Surroundings_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Residential_Risk_Fire_Water]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Residential_Risk_Fire_Water](
	[Water_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Gutters] [bit] NOT NULL,
	[Gutters_Clear] [bit] NOT NULL,
	[Gutter_Cleaning_Period] [int] NOT NULL,
	[Geyser_Type_ID] [int] NOT NULL,
	[All_Overflow_Trays_Fitted] [bit] NOT NULL,
	[Near_Watercourse] [bit] NOT NULL,
	[Watercourse_Distance] [float] NOT NULL,
	[Has_Floodline] [bit] NOT NULL,
	[Floodline_Location_ID] [int] NOT NULL,
	[Stain_Location_ID] [int] NOT NULL,
	[Stain_Description] [varchar](max) NOT NULL,
	[Number_Of_Photos] [int] NOT NULL,
 CONSTRAINT [PK_RRF_Water] PRIMARY KEY CLUSTERED 
(
	[Water_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Risk_Assessment]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Risk_Assessment](
	[Risk_Assessment_ID] [int] IDENTITY(1,1) NOT NULL,
	[Location_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Inventory_ID] [int] NOT NULL,
	[Domestic_Risk_ID] [int] NOT NULL,
	[Residential_Building_ID] [int] NOT NULL,
	[Residential_Risk_Fire_ID] [int] NOT NULL,
	[Vehicle_Inspection_ID] [int] NOT NULL,
	[Risk_Assessment_Description] [varchar](max) NOT NULL,
	[Risk_Assessment_Date] [datetime] NOT NULL,
	[Risk_Assessment_Time] [datetime] NOT NULL,
	[Risk_Assessment_Total_Value] [float] NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[Updated_At] [datetime] NOT NULL,
 CONSTRAINT [PK_Risk_Assessment] PRIMARY KEY CLUSTERED 
(
	[Risk_Assessment_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Stain_Location]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Stain_Location](
	[Stain_Location_ID] [int] IDENTITY(1,1) NOT NULL,
	[Stain_Location] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Stain_Location] PRIMARY KEY CLUSTERED 
(
	[Stain_Location_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Stove_Type]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Stove_Type](
	[Stove_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Stove_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Stove_Type] PRIMARY KEY CLUSTERED 
(
	[Stove_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tennis_Court_Condition]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tennis_Court_Condition](
	[Tennis_Court_Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Tennis_Court_Condition] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Tennis_Court_Condition] PRIMARY KEY CLUSTERED 
(
	[Tennis_Court_Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tennis_Court_Features]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tennis_Court_Features](
	[Tennis_Court_Features_ID] [int] IDENTITY(1,1) NOT NULL,
	[Tennis_Court_Features] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Tennis_Court_Features] PRIMARY KEY CLUSTERED 
(
	[Tennis_Court_Features_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Tyre_Condition]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Tyre_Condition](
	[Tyre_Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Tyre_Condition] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Tyre_Condition] PRIMARY KEY CLUSTERED 
(
	[Tyre_Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Unit_Type]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Unit_Type](
	[Unit_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Unit_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Unit_Type] PRIMARY KEY CLUSTERED 
(
	[Unit_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Brand]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Brand](
	[Vehicle_Brand_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vehicle_Make_ID] [int] NOT NULL,
	[Vehicle_Model_ID] [int] NOT NULL,
 CONSTRAINT [PK_Vehicle_Brand] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Brand_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection](
	[Vehicle_Inspection_ID] [int] IDENTITY(1,1) NOT NULL,
	[Risk_Assessment_ID] [int] NOT NULL,
	[Company_ID] [int] NOT NULL,
	[Vehicle_Details_ID] [int] NOT NULL,
	[Use_Factors_ID] [int] NOT NULL,
	[Condition_ID] [int] NOT NULL,
	[Parking_ID] [int] NOT NULL,
	[Accessories_Extras_ID] [int] NOT NULL,
	[Inspection_Date] [datetime] NULL,
	[Inspection_Time] [datetime] NULL,
	[Client_Signature] [bit] NULL,
	[Client_Signature_Date] [datetime] NULL,
	[Surveyor_Signature] [bit] NULL,
	[Surveyor_Signature_Date] [datetime] NULL,
 CONSTRAINT [PK_Vehicle_Inspection] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Inspection_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection_Accessories_Extras]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection_Accessories_Extras](
	[Accessories_Extras_ID] [int] IDENTITY(1,1) NOT NULL,
	[Has_Radio] [bit] NOT NULL,
	[Radio_Make] [varchar](50) NOT NULL,
	[Radio_Model] [varchar](50) NOT NULL,
	[Has_Alarm] [bit] NOT NULL,
	[Alarm_Details] [varchar](50) NOT NULL,
	[Has_Gearlock] [bit] NOT NULL,
	[Gearlock_Details] [varchar](50) NOT NULL,
	[Has_Tracker] [bit] NOT NULL,
	[Tracker_Details] [varchar](50) NOT NULL,
	[Gearbox_Type] [varchar](50) NOT NULL,
	[Has_Mag_Wheels] [bit] NOT NULL,
	[Has_Phone_Kit] [bit] NOT NULL,
	[Has_Smash_Grab] [bit] NOT NULL,
	[Has_Electric_Windows] [bit] NOT NULL,
	[Has_Canopy] [bit] NOT NULL,
	[Has_Roofrack] [bit] NOT NULL,
	[Has_Sunroof] [bit] NOT NULL,
	[Has_Window_Tint] [bit] NOT NULL,
	[Has_Cruise_Control] [bit] NOT NULL,
	[Has_Leather_Interior] [bit] NOT NULL,
	[Has_Transponder] [bit] NOT NULL,
	[Has_Aircon] [bit] NOT NULL,
	[Has_Power_Steering] [bit] NOT NULL,
	[Has_Spoiler] [bit] NOT NULL,
 CONSTRAINT [PK_Accessories_Extras] PRIMARY KEY CLUSTERED 
(
	[Accessories_Extras_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection_Condition]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection_Condition](
	[Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Previously_Owned] [bit] NOT NULL,
	[Purchased_New] [bit] NOT NULL,
	[Been_Rebuilt] [bit] NOT NULL,
	[Been_Modified] [bit] NOT NULL,
	[Has_Body_Damage] [bit] NOT NULL,
	[Body_Damage_Description] [varchar](max) NOT NULL,
	[Has_Interior_Damage] [bit] NOT NULL,
	[Interior_Damage_Description] [varchar](max) NOT NULL,
	[Tyre_Condition_ID] [int] NOT NULL,
	[Windscreen_Condition_ID] [int] NOT NULL,
 CONSTRAINT [PK_Condition] PRIMARY KEY CLUSTERED 
(
	[Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection_Parking]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection_Parking](
	[Parking_ID] [int] IDENTITY(1,1) NOT NULL,
	[Daytime_Parking_ID] [int] NOT NULL,
	[Overnight_Parking_ID] [int] NOT NULL,
 CONSTRAINT [PK_Parking] PRIMARY KEY CLUSTERED 
(
	[Parking_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection_Use_Factors]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection_Use_Factors](
	[Use_Factors_ID] [int] IDENTITY(1,1) NOT NULL,
	[Car_Number_ID] [int] NOT NULL,
	[Car_Use_ID] [int] NOT NULL,
 CONSTRAINT [PK_Use_Factors] PRIMARY KEY CLUSTERED 
(
	[Use_Factors_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Inspection_Vehicle_Details]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Inspection_Vehicle_Details](
	[Vehicle_Details_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vehicle_Year] [date] NOT NULL,
	[Vehicle_Description] [varchar](max) NOT NULL,
	[Registration_Number] [varchar](50) NOT NULL,
	[Vin_Number] [varchar](50) NOT NULL,
	[Odometer_Reading] [float] NOT NULL,
	[Vehicle_Colour] [varchar](50) NOT NULL,
	[Engine_Number] [varchar](50) NOT NULL,
	[License_Expiry] [datetime] NOT NULL,
	[Principal_Driver] [varchar](50) NOT NULL,
	[ID_Number] [int] NOT NULL,
	[Resident_With_Client] [bit] NOT NULL,
	[Vehicle_Brand_ID] [int] NOT NULL,
	[Vehicle_Type_ID] [int] NOT NULL,
	[Explanation_From_Client] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Vehicle_Details] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Details_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Make]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Make](
	[Vehicle_Make_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vehicle_Make] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Vehicle_Make] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Make_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Model]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Model](
	[Vehicle_Model_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vehicle_Model] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Vehicle_Model] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Model_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Vehicle_Type]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Vehicle_Type](
	[Vehicle_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Vehicle_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Vehicle_Type] PRIMARY KEY CLUSTERED 
(
	[Vehicle_Type_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Window_Protection]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Window_Protection](
	[Window_Protection_ID] [int] IDENTITY(1,1) NOT NULL,
	[Window_Protection_Type] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Window_Protection] PRIMARY KEY CLUSTERED 
(
	[Window_Protection_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Windscreen_Condition]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Windscreen_Condition](
	[Windscreen_Condition_ID] [int] IDENTITY(1,1) NOT NULL,
	[Windscreen_Condition] [varchar](50) NOT NULL,
 CONSTRAINT [PK_Windscreen_Condition] PRIMARY KEY CLUSTERED 
(
	[Windscreen_Condition_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Within_Radius]    Script Date: 2023/01/13 09:13:44 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Within_Radius](
	[Within_Radius_ID] [int] IDENTITY(1,1) NOT NULL,
	[Within_Radius_Type] [varchar](max) NOT NULL,
 CONSTRAINT [PK_Within_Radius] PRIMARY KEY CLUSTERED 
(
	[Within_Radius_ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[Appointments]  WITH CHECK ADD  CONSTRAINT [FK_Appointments_Location] FOREIGN KEY([Location_ID])
REFERENCES [dbo].[Location] ([Location_ID])
GO
ALTER TABLE [dbo].[Appointments] CHECK CONSTRAINT [FK_Appointments_Location]
GO
ALTER TABLE [dbo].[Appointments]  WITH CHECK ADD  CONSTRAINT [FK_Appointments_Recurrence] FOREIGN KEY([Recurrence_ID])
REFERENCES [dbo].[Recurrence] ([Recurrence_ID])
GO
ALTER TABLE [dbo].[Appointments] CHECK CONSTRAINT [FK_Appointments_Recurrence]
GO
ALTER TABLE [dbo].[Audit_Trail]  WITH CHECK ADD  CONSTRAINT [FK_Audit_Trail_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Audit_Trail] CHECK CONSTRAINT [FK_Audit_Trail_Company]
GO
ALTER TABLE [dbo].[Broker_Contact]  WITH CHECK ADD  CONSTRAINT [FK_Broker_Contact_Broker_Organisation] FOREIGN KEY([Broker_Organisation_ID])
REFERENCES [dbo].[Broker_Organisation] ([Broker_Organisation_ID])
GO
ALTER TABLE [dbo].[Broker_Contact] CHECK CONSTRAINT [FK_Broker_Contact_Broker_Organisation]
GO
ALTER TABLE [dbo].[Broker_Organisation]  WITH CHECK ADD  CONSTRAINT [FK_Broker_Organisation_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Broker_Organisation] CHECK CONSTRAINT [FK_Broker_Organisation_Company]
GO
ALTER TABLE [dbo].[Client]  WITH CHECK ADD  CONSTRAINT [FK_Client_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Client] CHECK CONSTRAINT [FK_Client_Company]
GO
ALTER TABLE [dbo].[Client]  WITH CHECK ADD  CONSTRAINT [FK_Client_Policy_Type] FOREIGN KEY([Policy_Type_ID])
REFERENCES [dbo].[Policy_Type] ([Policy_Type_ID])
GO
ALTER TABLE [dbo].[Client] CHECK CONSTRAINT [FK_Client_Policy_Type]
GO
ALTER TABLE [dbo].[Company]  WITH CHECK ADD  CONSTRAINT [FK_Company_Location] FOREIGN KEY([Location_ID])
REFERENCES [dbo].[Location] ([Location_ID])
GO
ALTER TABLE [dbo].[Company] CHECK CONSTRAINT [FK_Company_Location]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Company]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Construction_Information] FOREIGN KEY([Construction_Information_ID])
REFERENCES [dbo].[Domestic_Risk_Construction_Information] ([Construction_Information_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Construction_Information]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Detatched_House] FOREIGN KEY([Detatched_House_ID])
REFERENCES [dbo].[Domestic_Risk_Detatched_House] ([Detatched_House_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Detatched_House]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Entrances] FOREIGN KEY([Entrances_ID])
REFERENCES [dbo].[Domestic_Risk_Entrances] ([Entrances_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Entrances]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Estates_Complexes_Flats] FOREIGN KEY([Estates_Complexes_Flats_ID])
REFERENCES [dbo].[Domestic_Risk_Estates_Complexes_Flats] ([Estates_Complexes_Flats_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Estates_Complexes_Flats]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Occupancy] FOREIGN KEY([Occupancy_ID])
REFERENCES [dbo].[Domestic_Risk_Occupancy] ([Occupancy_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Occupancy]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Other_Features] FOREIGN KEY([Other_Features_ID])
REFERENCES [dbo].[Domestic_Risk_Other_Features] ([Other_Features_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Other_Features]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Residence_Information] FOREIGN KEY([Residence_Information_ID])
REFERENCES [dbo].[Domestic_Risk_Residence_Information] ([Residence_Information_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Residence_Information]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Vehicles] FOREIGN KEY([Vehicles_ID])
REFERENCES [dbo].[Domestic_Risk_Vehicles] ([Vehicles_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Vehicles]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Windows] FOREIGN KEY([Windows_ID])
REFERENCES [dbo].[Domestic_Risk_Windows] ([Windows_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Domestic_Risk_Windows]
GO
ALTER TABLE [dbo].[Domestic_Risk]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Marital_Status] FOREIGN KEY([Marital_Status_ID])
REFERENCES [dbo].[Marital_Status] ([Marital_Status_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk] CHECK CONSTRAINT [FK_Domestic_Risk_Marital_Status]
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Detatched_House_Building_Use] FOREIGN KEY([Building_Use_ID])
REFERENCES [dbo].[Building_Use] ([Building_Use_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House] CHECK CONSTRAINT [FK_Domestic_Risk_Detatched_House_Building_Use]
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Detatched_House_Property_Adjacent] FOREIGN KEY([Property_Adjacent_ID])
REFERENCES [dbo].[Property_Adjacent] ([Property_Adjacent_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House] CHECK CONSTRAINT [FK_Domestic_Risk_Detatched_House_Property_Adjacent]
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Detatched_House_Within_Radius] FOREIGN KEY([Within_Radius_ID])
REFERENCES [dbo].[Within_Radius] ([Within_Radius_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Detatched_House] CHECK CONSTRAINT [FK_Domestic_Risk_Detatched_House_Within_Radius]
GO
ALTER TABLE [dbo].[Domestic_Risk_Estates_Complexes_Flats]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Estates_Complexes_Flats_Unit_Type] FOREIGN KEY([Estates_Complexes_Flats_ID])
REFERENCES [dbo].[Unit_Type] ([Unit_Type_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Estates_Complexes_Flats] CHECK CONSTRAINT [FK_Domestic_Risk_Estates_Complexes_Flats_Unit_Type]
GO
ALTER TABLE [dbo].[Domestic_Risk_Windows]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Windows_Open_Window_Protection] FOREIGN KEY([Open_Window_Protection_ID])
REFERENCES [dbo].[Open_Window_Protection] ([Open_Window_Protection_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Windows] CHECK CONSTRAINT [FK_Domestic_Risk_Windows_Open_Window_Protection]
GO
ALTER TABLE [dbo].[Domestic_Risk_Windows]  WITH CHECK ADD  CONSTRAINT [FK_Domestic_Risk_Windows_Window_Protection] FOREIGN KEY([Window_Protection_ID])
REFERENCES [dbo].[Window_Protection] ([Window_Protection_ID])
GO
ALTER TABLE [dbo].[Domestic_Risk_Windows] CHECK CONSTRAINT [FK_Domestic_Risk_Windows_Window_Protection]
GO
ALTER TABLE [dbo].[Employee]  WITH CHECK ADD  CONSTRAINT [FK_Employee_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Employee] CHECK CONSTRAINT [FK_Employee_Company]
GO
ALTER TABLE [dbo].[Employee]  WITH CHECK ADD  CONSTRAINT [FK_Employee_Employee_Commission] FOREIGN KEY([Employee_Comission_ID])
REFERENCES [dbo].[Employee_Commission] ([Employee_Commission_ID])
GO
ALTER TABLE [dbo].[Employee] CHECK CONSTRAINT [FK_Employee_Employee_Commission]
GO
ALTER TABLE [dbo].[Employee]  WITH CHECK ADD  CONSTRAINT [FK_Employee_Employee_Type] FOREIGN KEY([Employee_Type_ID])
REFERENCES [dbo].[Employee_Type] ([Employee_Type_ID])
GO
ALTER TABLE [dbo].[Employee] CHECK CONSTRAINT [FK_Employee_Employee_Type]
GO
ALTER TABLE [dbo].[Employee_Commission]  WITH CHECK ADD  CONSTRAINT [FK_Employee_Commission_Comission_Type] FOREIGN KEY([Comission_Type_ID])
REFERENCES [dbo].[Comission_Type] ([Comission_Type_ID])
GO
ALTER TABLE [dbo].[Employee_Commission] CHECK CONSTRAINT [FK_Employee_Commission_Comission_Type]
GO
ALTER TABLE [dbo].[Insurer_Contact]  WITH CHECK ADD  CONSTRAINT [FK_Insurer_Contact_Insurer_Organisation] FOREIGN KEY([Insurer_Organisation_ID])
REFERENCES [dbo].[Insurer_Organisation] ([Insurer_Organisation_ID])
GO
ALTER TABLE [dbo].[Insurer_Contact] CHECK CONSTRAINT [FK_Insurer_Contact_Insurer_Organisation]
GO
ALTER TABLE [dbo].[Insurer_Organisation]  WITH CHECK ADD  CONSTRAINT [FK_Insurer_Organisation_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Insurer_Organisation] CHECK CONSTRAINT [FK_Insurer_Organisation_Company]
GO
ALTER TABLE [dbo].[Inventory]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Inventory] CHECK CONSTRAINT [FK_Inventory_Company]
GO
ALTER TABLE [dbo].[Inventory]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Inventory_Agreed_Value_Items] FOREIGN KEY([Agreed_Value_Items_ID])
REFERENCES [dbo].[Inventory_Agreed_Value_Items] ([Agreed_Value_Items_ID])
GO
ALTER TABLE [dbo].[Inventory] CHECK CONSTRAINT [FK_Inventory_Inventory_Agreed_Value_Items]
GO
ALTER TABLE [dbo].[Inventory]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Inventory_Replacement_Value_Items] FOREIGN KEY([Replacement_Value_Items_ID])
REFERENCES [dbo].[Inventory_Replacement_Value_Items] ([Replacement_Value_Items_ID])
GO
ALTER TABLE [dbo].[Inventory] CHECK CONSTRAINT [FK_Inventory_Inventory_Replacement_Value_Items]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Antiques] FOREIGN KEY([Antiques_ID])
REFERENCES [dbo].[Inventory_Antiques] ([Antiques_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Antiques]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Clothing] FOREIGN KEY([Clothing_ID])
REFERENCES [dbo].[Inventory_Clothing] ([Clothing_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Clothing]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Collections] FOREIGN KEY([Collections_ID])
REFERENCES [dbo].[Inventory_Collections] ([Collections_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Collections]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Firearms] FOREIGN KEY([Firearms_Bows_ID])
REFERENCES [dbo].[Inventory_Firearms] ([Firearms_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Firearms]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Furniture] FOREIGN KEY([Furniture_ID])
REFERENCES [dbo].[Inventory_Furniture] ([Furniture_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Furniture]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Jewelry] FOREIGN KEY([Jewelry_ID])
REFERENCES [dbo].[Inventory_Jewelry] ([Jewelry_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Jewelry]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Kitchenware] FOREIGN KEY([Kitchenware_ID])
REFERENCES [dbo].[Inventory_Kitchenware] ([Kitchenware_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Kitchenware]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Linen] FOREIGN KEY([Linen_ID])
REFERENCES [dbo].[Inventory_Linen] ([Linen_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Linen]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Luggage_Containers] FOREIGN KEY([Luggage_Containers_ID])
REFERENCES [dbo].[Inventory_Luggage_Containers] ([Luggage_Container_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Luggage_Containers]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Other_Agreed_Items] FOREIGN KEY([Other_Agreed_Items_ID])
REFERENCES [dbo].[Inventory_Other_Agreed_Items] ([Other_Agreed_Items_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Other_Agreed_Items]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Outdoor_Equipment] FOREIGN KEY([Outdoor_Equipment_ID])
REFERENCES [dbo].[Inventory_Outdoor_Equipment] ([Outdoor_Equipment_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Outdoor_Equipment]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Personal_Effects] FOREIGN KEY([Personal_Effects_ID])
REFERENCES [dbo].[Inventory_Personal_Effects] ([Personal_Effects_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Personal_Effects]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Sports_Equipment] FOREIGN KEY([Sports_Equipment_ID])
REFERENCES [dbo].[Inventory_Sports_Equipment] ([Sports_Equipment_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Sports_Equipment]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Artworks] FOREIGN KEY([Valuable_Artworks_ID])
REFERENCES [dbo].[Inventory_Valuable_Artworks] ([Valuable_Artworks_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Artworks]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Carpets] FOREIGN KEY([Valuable_Carpets_ID])
REFERENCES [dbo].[Inventory_Valuable_Carpets] ([Valuable_Carpets_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Carpets]
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Ornaments] FOREIGN KEY([Valuable_Ornaments_ID])
REFERENCES [dbo].[Inventory_Valuable_Ornaments] ([Valuable_Ornaments_ID])
GO
ALTER TABLE [dbo].[Inventory_Agreed_Value_Items] CHECK CONSTRAINT [FK_Inventory_Agreed_Value_Items_Inventory_Valuable_Ornaments]
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Domestic_Appliances] FOREIGN KEY([Domestic_Appliances_ID])
REFERENCES [dbo].[Inventory_Domestic_Appliances] ([Domestic_Appliances_ID])
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items] CHECK CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Domestic_Appliances]
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_High_Risk_Items] FOREIGN KEY([High_Risk_Items_ID])
REFERENCES [dbo].[Inventory_High_Risk_Items] ([High_Risk_Items_ID])
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items] CHECK CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_High_Risk_Items]
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Photographic_Equipment] FOREIGN KEY([Photographic_Equipment_ID])
REFERENCES [dbo].[Inventory_Photographic_Equipment] ([Photographic_Equipment_ID])
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items] CHECK CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Photographic_Equipment]
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Power_Tools] FOREIGN KEY([Power_Tools_ID])
REFERENCES [dbo].[Inventory_Power_Tools] ([Power_Tools_ID])
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items] CHECK CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Power_Tools]
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items]  WITH CHECK ADD  CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Visual_Sound_Comp] FOREIGN KEY([Visual_Sound_Comp_ID])
REFERENCES [dbo].[Inventory_Visual_Sound_Comp] ([Visual_Sound_Comp_ID])
GO
ALTER TABLE [dbo].[Inventory_Replacement_Value_Items] CHECK CONSTRAINT [FK_Inventory_Replacement_Value_Items_Inventory_Visual_Sound_Comp]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Appointments] FOREIGN KEY([Appointments_ID])
REFERENCES [dbo].[Appointments] ([Appointments_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Appointments]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Billing_Information] FOREIGN KEY([Billing_Information_ID])
REFERENCES [dbo].[Billing_Information] ([Billing_Information_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Billing_Information]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Client] FOREIGN KEY([Client_ID])
REFERENCES [dbo].[Client] ([Client_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Client]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Company]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Order_Status] FOREIGN KEY([Order_Status_ID])
REFERENCES [dbo].[Order_Status] ([Order_Status_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Order_Status]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Order_Template] FOREIGN KEY([Order_Template_ID])
REFERENCES [dbo].[Order_Template] ([Order_Template_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Order_Template]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Risk_Assessment] FOREIGN KEY([Risk_Assessment_ID])
REFERENCES [dbo].[Risk_Assessment] ([Risk_Assessment_ID])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Risk_Assessment]
GO
ALTER TABLE [dbo].[Recurrence]  WITH CHECK ADD  CONSTRAINT [FK_Recurrence_Recurrence_Type] FOREIGN KEY([Recurrence_Type_ID])
REFERENCES [dbo].[Recurrence_Type] ([Recurrence_Type_ID])
GO
ALTER TABLE [dbo].[Recurrence] CHECK CONSTRAINT [FK_Recurrence_Recurrence_Type]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Building_Slope] FOREIGN KEY([Building_Slope_ID])
REFERENCES [dbo].[Building_Slope] ([Building_Slope_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Building_Slope]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Company]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Property_Condition] FOREIGN KEY([Property_Condition_ID])
REFERENCES [dbo].[Property_Condition] ([Property_Condition_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Property_Condition]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Balconies] FOREIGN KEY([Baclonies_ID])
REFERENCES [dbo].[Residential_Building_Balconies] ([Balconies_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Balconies]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Cottage_Flat] FOREIGN KEY([Cottage_Flat_ID])
REFERENCES [dbo].[Residential_Building_Cottage_Flat] ([Cottage_Flat_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Cottage_Flat]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Electric_Fence] FOREIGN KEY([Electric_Fencing_ID])
REFERENCES [dbo].[Residential_Building_Electric_Fence] ([Electric_Fence_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Electric_Fence]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Garages] FOREIGN KEY([Garages_ID])
REFERENCES [dbo].[Residential_Building_Garages] ([Garages_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Garages]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Lapa] FOREIGN KEY([Lapa_ID])
REFERENCES [dbo].[Residential_Building_Lapa] ([Lapa_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Lapa]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Main_Building] FOREIGN KEY([Main_Building_ID])
REFERENCES [dbo].[Residential_Building_Main_Building] ([Main_Building_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Main_Building]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_One] FOREIGN KEY([Other_One_ID])
REFERENCES [dbo].[Residential_Building_Other_Features_One] ([Other_Features_One_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_One]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_Three] FOREIGN KEY([Other_Three_ID])
REFERENCES [dbo].[Residential_Building_Other_Features_Three] ([Other_Features_Three_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_Three]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_Two] FOREIGN KEY([Other_Two_ID])
REFERENCES [dbo].[Residential_Building_Other_Features_Two] ([Other_Features_Two_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Other_Features_Two]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Outdoor_Paving_Tiling_Decking] FOREIGN KEY([Outdoor_Paving_Tiling_Decking_ID])
REFERENCES [dbo].[Residential_Building_Outdoor_Paving_Tiling_Decking] ([Outdoor_Paving_Tiling_Decking_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Outdoor_Paving_Tiling_Decking]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Patios_Pergolas] FOREIGN KEY([Patios_Pergola_ID])
REFERENCES [dbo].[Residential_Building_Patios_Pergolas] ([Patios_Pergolas_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Patios_Pergolas]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Photograph_Checklist] FOREIGN KEY([Photograph_Checklist_ID])
REFERENCES [dbo].[Residential_Building_Photograph_Checklist] ([Photograph_Checklist_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Photograph_Checklist]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Property_Features] FOREIGN KEY([Property_Features_ID])
REFERENCES [dbo].[Residential_Building_Property_Features] ([Property_Features_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Property_Features]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Seperate_Laundry] FOREIGN KEY([Seperate_Laundry_ID])
REFERENCES [dbo].[Residential_Building_Seperate_Laundry] ([Seperate_Laundry_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Seperate_Laundry]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Staff_Quarters] FOREIGN KEY([Staff_Quarters_ID])
REFERENCES [dbo].[Residential_Building_Staff_Quarters] ([Staff_Quarters_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Staff_Quarters]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Storeroom] FOREIGN KEY([Storeroom_ID])
REFERENCES [dbo].[Residential_Building_Storeroom] ([Storeroom_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Storeroom]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Underwriting_Factors] FOREIGN KEY([Underwriting_Factors_ID])
REFERENCES [dbo].[Residential_Building_Underwriting_Factors] ([Underwriting_Factors_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Underwriting_Factors]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Residential_Building_Walls_Retaining_Walls_Fences] FOREIGN KEY([Walls_Retaining_Walls_Fencing_ID])
REFERENCES [dbo].[Residential_Building_Walls_Retaining_Walls_Fences] ([Walls_Retaining_Walls_Fences_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Residential_Building_Walls_Retaining_Walls_Fences]
GO
ALTER TABLE [dbo].[Residential_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Tennis_Court_Condition] FOREIGN KEY([Tennis_Court_Condition_ID])
REFERENCES [dbo].[Tennis_Court_Condition] ([Tennis_Court_Condition_ID])
GO
ALTER TABLE [dbo].[Residential_Building] CHECK CONSTRAINT [FK_Residential_Building_Tennis_Court_Condition]
GO
ALTER TABLE [dbo].[Residential_Building_Cottage_Flat]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Cottage_Flat_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Cottage_Flat] CHECK CONSTRAINT [FK_Residential_Building_Cottage_Flat_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Main_Building_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building] CHECK CONSTRAINT [FK_Residential_Building_Main_Building_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Features] FOREIGN KEY([Main_Building_Features_ID])
REFERENCES [dbo].[Residential_Building_MB_Features] ([Main_Building_Features_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building] CHECK CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Features]
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Green_Solution] FOREIGN KEY([Main_Building_Green_Solutions_ID])
REFERENCES [dbo].[Residential_Building_MB_Green_Solution] ([Main_Building_Green_Solutions_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building] CHECK CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Green_Solution]
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Security] FOREIGN KEY([Main_Building_Security_ID])
REFERENCES [dbo].[Residential_Building_MB_Security] ([Main_Building_Security_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Main_Building] CHECK CONSTRAINT [FK_Residential_Building_Main_Building_Residential_Building_MB_Security]
GO
ALTER TABLE [dbo].[Residential_Building_MB_Features]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_MB_Features_Fireplace_Type] FOREIGN KEY([Fireplace_Type_ID])
REFERENCES [dbo].[Fireplace_Type] ([Fireplace_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Building_MB_Features] CHECK CONSTRAINT [FK_Residential_Building_MB_Features_Fireplace_Type]
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_One]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Other_Features_One_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_One] CHECK CONSTRAINT [FK_Residential_Building_Other_Features_One_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_Three]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Other_Features_Three_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_Three] CHECK CONSTRAINT [FK_Residential_Building_Other_Features_Three_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_Two]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Other_Features_Two_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Other_Features_Two] CHECK CONSTRAINT [FK_Residential_Building_Other_Features_Two_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Property_Features_Electric_Gate_Type] FOREIGN KEY([Electric_Gate_Type_ID])
REFERENCES [dbo].[Electric_Gate_Type] ([Electric_Gate_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features] CHECK CONSTRAINT [FK_Residential_Building_Property_Features_Electric_Gate_Type]
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Property_Features_Pool_Features] FOREIGN KEY([Pool_Features_ID])
REFERENCES [dbo].[Pool_Features] ([Pool_Features_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features] CHECK CONSTRAINT [FK_Residential_Building_Property_Features_Pool_Features]
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Property_Features_Tennis_Court_Features] FOREIGN KEY([Tennis_Court_Features_ID])
REFERENCES [dbo].[Tennis_Court_Features] ([Tennis_Court_Features_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Property_Features] CHECK CONSTRAINT [FK_Residential_Building_Property_Features_Tennis_Court_Features]
GO
ALTER TABLE [dbo].[Residential_Building_Staff_Quarters]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Staff_Quarters_Housing_Category] FOREIGN KEY([Housing_Category_ID])
REFERENCES [dbo].[Housing_Category] ([Housing_Category_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Staff_Quarters] CHECK CONSTRAINT [FK_Residential_Building_Staff_Quarters_Housing_Category]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Farms_Smallholdings]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Farms_Smallholdings_Buildings_Location] FOREIGN KEY([Buildings_Location_ID])
REFERENCES [dbo].[Buildings_Location] ([Buidlings_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Farms_Smallholdings] CHECK CONSTRAINT [FK_Residential_Building_UF_Farms_Smallholdings_Buildings_Location]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Fire_Electricity_Supply] FOREIGN KEY([Electricity_Supply_ID])
REFERENCES [dbo].[Electricity_Supply] ([Electricity_Supply_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire] CHECK CONSTRAINT [FK_Residential_Building_UF_Fire_Electricity_Supply]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Fire_Gas_Cylinder_Location] FOREIGN KEY([Gas_Cylinder_Location_ID])
REFERENCES [dbo].[Gas_Cylinder_Location] ([Gas_Cylinder_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire] CHECK CONSTRAINT [FK_Residential_Building_UF_Fire_Gas_Cylinder_Location]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Fire_Stove_Type] FOREIGN KEY([Stove_Type_ID])
REFERENCES [dbo].[Stove_Type] ([Stove_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Fire] CHECK CONSTRAINT [FK_Residential_Building_UF_Fire_Stove_Type]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Subsidence_Landslip]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Subsidence_Landslip_Cracks_Type] FOREIGN KEY([Cracks_Type_ID])
REFERENCES [dbo].[Cracks_Type] ([Cracks_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Subsidence_Landslip] CHECK CONSTRAINT [FK_Residential_Building_UF_Subsidence_Landslip_Cracks_Type]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Water_Floodline_Location] FOREIGN KEY([Floodline_Location_ID])
REFERENCES [dbo].[Floodline_Location] ([Floodline_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water] CHECK CONSTRAINT [FK_Residential_Building_UF_Water_Floodline_Location]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Water_Geyser_Type] FOREIGN KEY([Geyser_Type_ID])
REFERENCES [dbo].[Geyser_Type] ([Geyser_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water] CHECK CONSTRAINT [FK_Residential_Building_UF_Water_Geyser_Type]
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_UF_Water_Stain_Location] FOREIGN KEY([Stain_Location_ID])
REFERENCES [dbo].[Stain_Location] ([Stain_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Building_UF_Water] CHECK CONSTRAINT [FK_Residential_Building_UF_Water_Stain_Location]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Building_Use] FOREIGN KEY([Building_Use_ID])
REFERENCES [dbo].[Building_Use] ([Building_Use_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Building_Use]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Property_Occupation] FOREIGN KEY([Property_Occupation_ID])
REFERENCES [dbo].[Property_Occupation] ([Property_Occupation_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Property_Occupation]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Farms_Smallholdings] FOREIGN KEY([Farms_Smallholdings_ID])
REFERENCES [dbo].[Residential_Building_UF_Farms_Smallholdings] ([Farms_Smallholdings_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Farms_Smallholdings]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Fire] FOREIGN KEY([Fire_ID])
REFERENCES [dbo].[Residential_Building_UF_Fire] ([Fire_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Fire]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Subsidence_Landslip] FOREIGN KEY([Subsidence_Landslip_ID])
REFERENCES [dbo].[Residential_Building_UF_Subsidence_Landslip] ([Subsidence_Landslip_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Subsidence_Landslip]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Thatch] FOREIGN KEY([Thatch_ID])
REFERENCES [dbo].[Residential_Building_UF_Thatch] ([Thatch_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Thatch]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Water] FOREIGN KEY([Water_ID])
REFERENCES [dbo].[Residential_Building_UF_Water] ([Water_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Residential_Building_UF_Water]
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Within_Radius] FOREIGN KEY([Within_Radius_ID])
REFERENCES [dbo].[Within_Radius] ([Within_Radius_ID])
GO
ALTER TABLE [dbo].[Residential_Building_Underwriting_Factors] CHECK CONSTRAINT [FK_Residential_Building_Underwriting_Factors_Within_Radius]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Building_Slope] FOREIGN KEY([Building_Slope_ID])
REFERENCES [dbo].[Building_Slope] ([Building_Slope_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Building_Slope]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Company]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_House_Keeping_State] FOREIGN KEY([House_Keeping_State_ID])
REFERENCES [dbo].[House_Keeping_State] ([House_Keeping_State_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_House_Keeping_State]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Property_Condition] FOREIGN KEY([Property_Condition_ID])
REFERENCES [dbo].[Property_Condition] ([Property_Condition_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Property_Condition]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Farms_Smallholdings] FOREIGN KEY([Farms_Smallholdings_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Farms_Smallholdings] ([Farms_Smallholdings_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Farms_Smallholdings]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Fire] FOREIGN KEY([Fire_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Fire] ([Fire_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Fire]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_General] FOREIGN KEY([General_ID])
REFERENCES [dbo].[Residential_Risk_Fire_General] ([General_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_General]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Subsidence_Landslip] FOREIGN KEY([Subsidence_Landslip_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Subsidence_Landslip] ([Subsidence_Landslip_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Subsidence_Landslip]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Thatch] FOREIGN KEY([Thatch_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Thatch] ([Thatch_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Thatch]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Theft] FOREIGN KEY([Theft_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft] ([Theft_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Theft]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Water] FOREIGN KEY([Water_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Water] ([Water_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Residential_Risk_Fire_Water]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Tennis_Court_Condition] FOREIGN KEY([Tennis_Court_Condition_ID])
REFERENCES [dbo].[Tennis_Court_Condition] ([Tennis_Court_Condition_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Tennis_Court_Condition]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Electricity_Supply] FOREIGN KEY([Electricity_Supply__ID])
REFERENCES [dbo].[Electricity_Supply] ([Electricity_Supply_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Electricity_Supply]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Fuel_Container] FOREIGN KEY([Fuel_Container_ID])
REFERENCES [dbo].[Fuel_Container] ([Fuel_Container_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Fuel_Container]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Gas_Cylinder_Location] FOREIGN KEY([Gas_Cylinder_Location_ID])
REFERENCES [dbo].[Gas_Cylinder_Location] ([Gas_Cylinder_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Gas_Cylinder_Location]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Power_Surge_Protection] FOREIGN KEY([Power_Surge_Protection_ID])
REFERENCES [dbo].[Power_Surge_Protection] ([Power_Surge_Protection_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Power_Surge_Protection]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Stove_Type] FOREIGN KEY([Stove_Type_ID])
REFERENCES [dbo].[Stove_Type] ([Stove_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Electricity_Fuel_Flammables_Stove_Type]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Farms_Smallholdings]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Farms_Smallholdings_Buildings_Location] FOREIGN KEY([Buildings_Location_ID])
REFERENCES [dbo].[Buildings_Location] ([Buidlings_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Farms_Smallholdings] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Farms_Smallholdings_Buildings_Location]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Electricity_Fuel_Flammables] FOREIGN KEY([Electricity_Fuel_Flammables_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Electricity_Fuel_Flammables] ([Electricity_Fuel_Flammables_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Electricity_Fuel_Flammables]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Fire_Protections] FOREIGN KEY([Fire_Protection_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Fire_Protections] ([Fire_Protections_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Fire_Protections]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Homes_Fires_Braais] FOREIGN KEY([Home_Fires_Braais_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Homes_Fires_Braais] ([Homes_Fires_Braais_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Fire] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Fire_Residential_Risk_Fire_Homes_Fires_Braais]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_General_Building_Use] FOREIGN KEY([Building_Use_ID])
REFERENCES [dbo].[Building_Use] ([Building_Use_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General] CHECK CONSTRAINT [FK_Residential_Risk_Fire_General_Building_Use]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_General_Marital_Status] FOREIGN KEY([Marital_Status_ID])
REFERENCES [dbo].[Marital_Status] ([Marital_Status_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General] CHECK CONSTRAINT [FK_Residential_Risk_Fire_General_Marital_Status]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_General_Property_Occupation] FOREIGN KEY([Property_Occupation_ID])
REFERENCES [dbo].[Property_Occupation] ([Property_Occupation_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_General] CHECK CONSTRAINT [FK_Residential_Risk_Fire_General_Property_Occupation]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Subsidence_Landslip]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Subsidence_Landslip_Cracks_Type] FOREIGN KEY([Cracks_Type_ID])
REFERENCES [dbo].[Cracks_Type] ([Cracks_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Subsidence_Landslip] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Subsidence_Landslip_Cracks_Type]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Detatched_House] FOREIGN KEY([Theft_Detatched_House_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft_Detatched_House] ([Theft_Detatched_House_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Detatched_House]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Entrances_Windows] FOREIGN KEY([Theft_Entrances_Windows_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows] ([Theft_Entrances_Windows_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Entrances_Windows]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Estates_Complexes_Flats] FOREIGN KEY([Theft_Estates_Complexes_Flats_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft_Estates_Complexes_Flats] ([Theft_Estates_Complexes_Flats_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Estates_Complexes_Flats]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Occupancy] FOREIGN KEY([Theft_Occupancy_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft_Occupancy] ([Theft_Occupancy_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Occupancy]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Surroundings] FOREIGN KEY([Theft_Surroundings_ID])
REFERENCES [dbo].[Residential_Risk_Fire_Theft_Surroundings] ([Theft_Surroundings_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Residential_Risk_Fire_Theft_Surroundings]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Additional_Security] FOREIGN KEY([Additional_Security_ID])
REFERENCES [dbo].[Additional_Security] ([Additional_Security_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Additional_Security]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Open_Window_Protection] FOREIGN KEY([Opening_Window_Protection_ID])
REFERENCES [dbo].[Open_Window_Protection] ([Open_Window_Protection_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Open_Window_Protection]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Window_Protection] FOREIGN KEY([Window_Protection_ID])
REFERENCES [dbo].[Window_Protection] ([Window_Protection_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Entrances_Windows] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Entrances_Windows_Window_Protection]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Estates_Complexes_Flats]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Estates_Complexes_Flats_Unit_Type] FOREIGN KEY([Unit_Type_ID])
REFERENCES [dbo].[Unit_Type] ([Unit_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Estates_Complexes_Flats] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Estates_Complexes_Flats_Unit_Type]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Surroundings]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Surroundings_Property_Adjacent] FOREIGN KEY([Property_Adjacent_ID])
REFERENCES [dbo].[Property_Adjacent] ([Property_Adjacent_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Surroundings] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Surroundings_Property_Adjacent]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Surroundings]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Theft_Surroundings_Within_Radius] FOREIGN KEY([Within_Radius_ID])
REFERENCES [dbo].[Within_Radius] ([Within_Radius_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Theft_Surroundings] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Theft_Surroundings_Within_Radius]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Water_Floodline_Location] FOREIGN KEY([Floodline_Location_ID])
REFERENCES [dbo].[Floodline_Location] ([Floodline_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Water_Floodline_Location]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Water_Geyser_Type] FOREIGN KEY([Geyser_Type_ID])
REFERENCES [dbo].[Geyser_Type] ([Geyser_Type_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Water_Geyser_Type]
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water]  WITH CHECK ADD  CONSTRAINT [FK_Residential_Risk_Fire_Water_Stain_Location] FOREIGN KEY([Stain_Location_ID])
REFERENCES [dbo].[Stain_Location] ([Stain_Location_ID])
GO
ALTER TABLE [dbo].[Residential_Risk_Fire_Water] CHECK CONSTRAINT [FK_Residential_Risk_Fire_Water_Stain_Location]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Company]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Domestic_Risk] FOREIGN KEY([Domestic_Risk_ID])
REFERENCES [dbo].[Domestic_Risk] ([Domestic_Risk_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Domestic_Risk]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Inventory] FOREIGN KEY([Inventory_ID])
REFERENCES [dbo].[Inventory] ([Inventory_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Inventory]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Location] FOREIGN KEY([Location_ID])
REFERENCES [dbo].[Location] ([Location_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Location]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Residential_Building] FOREIGN KEY([Residential_Building_ID])
REFERENCES [dbo].[Residential_Building] ([Residential_Building_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Residential_Building]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Residential_Risk_Fire] FOREIGN KEY([Residential_Risk_Fire_ID])
REFERENCES [dbo].[Residential_Risk_Fire] ([Residential_Risk_Fire_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Residential_Risk_Fire]
GO
ALTER TABLE [dbo].[Risk_Assessment]  WITH CHECK ADD  CONSTRAINT [FK_Risk_Assessment_Vehicle_Inspection] FOREIGN KEY([Vehicle_Inspection_ID])
REFERENCES [dbo].[Vehicle_Inspection] ([Vehicle_Inspection_ID])
GO
ALTER TABLE [dbo].[Risk_Assessment] CHECK CONSTRAINT [FK_Risk_Assessment_Vehicle_Inspection]
GO
ALTER TABLE [dbo].[Vehicle_Brand]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Brand_Vehicle_Make] FOREIGN KEY([Vehicle_Make_ID])
REFERENCES [dbo].[Vehicle_Make] ([Vehicle_Make_ID])
GO
ALTER TABLE [dbo].[Vehicle_Brand] CHECK CONSTRAINT [FK_Vehicle_Brand_Vehicle_Make]
GO
ALTER TABLE [dbo].[Vehicle_Brand]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Brand_Vehicle_Model] FOREIGN KEY([Vehicle_Model_ID])
REFERENCES [dbo].[Vehicle_Model] ([Vehicle_Model_ID])
GO
ALTER TABLE [dbo].[Vehicle_Brand] CHECK CONSTRAINT [FK_Vehicle_Brand_Vehicle_Model]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Company] FOREIGN KEY([Company_ID])
REFERENCES [dbo].[Company] ([Company_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Company]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Accessories_Extras] FOREIGN KEY([Accessories_Extras_ID])
REFERENCES [dbo].[Vehicle_Inspection_Accessories_Extras] ([Accessories_Extras_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Accessories_Extras]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Condition] FOREIGN KEY([Condition_ID])
REFERENCES [dbo].[Vehicle_Inspection_Condition] ([Condition_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Condition]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Parking] FOREIGN KEY([Parking_ID])
REFERENCES [dbo].[Vehicle_Inspection_Parking] ([Parking_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Parking]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Use_Factors] FOREIGN KEY([Use_Factors_ID])
REFERENCES [dbo].[Vehicle_Inspection_Use_Factors] ([Use_Factors_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Use_Factors]
GO
ALTER TABLE [dbo].[Vehicle_Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Vehicle_Details] FOREIGN KEY([Vehicle_Details_ID])
REFERENCES [dbo].[Vehicle_Inspection_Vehicle_Details] ([Vehicle_Details_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Inspection_Vehicle_Details]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Condition]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Condition_Tyre_Condition] FOREIGN KEY([Tyre_Condition_ID])
REFERENCES [dbo].[Tyre_Condition] ([Tyre_Condition_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Condition] CHECK CONSTRAINT [FK_Vehicle_Inspection_Condition_Tyre_Condition]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Condition]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Condition_Windscreen_Condition] FOREIGN KEY([Windscreen_Condition_ID])
REFERENCES [dbo].[Windscreen_Condition] ([Windscreen_Condition_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Condition] CHECK CONSTRAINT [FK_Vehicle_Inspection_Condition_Windscreen_Condition]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Parking]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Parking_Daytime_Parking] FOREIGN KEY([Daytime_Parking_ID])
REFERENCES [dbo].[Daytime_Parking] ([Daytime_Parking_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Parking] CHECK CONSTRAINT [FK_Vehicle_Inspection_Parking_Daytime_Parking]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Parking]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Parking_Overnight_Parking] FOREIGN KEY([Overnight_Parking_ID])
REFERENCES [dbo].[Overnight_Parking] ([Overnight_Parking_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Parking] CHECK CONSTRAINT [FK_Vehicle_Inspection_Parking_Overnight_Parking]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Use_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Use_Factors_Car_Number] FOREIGN KEY([Car_Number_ID])
REFERENCES [dbo].[Car_Number] ([Car_Number_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Use_Factors] CHECK CONSTRAINT [FK_Vehicle_Inspection_Use_Factors_Car_Number]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Use_Factors]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Use_Factors_Car_Use] FOREIGN KEY([Car_Use_ID])
REFERENCES [dbo].[Car_Use] ([Car_Use_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Use_Factors] CHECK CONSTRAINT [FK_Vehicle_Inspection_Use_Factors_Car_Use]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Vehicle_Details]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Details_Vehicle_Brand] FOREIGN KEY([Vehicle_Brand_ID])
REFERENCES [dbo].[Vehicle_Brand] ([Vehicle_Brand_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Vehicle_Details] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Details_Vehicle_Brand]
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Vehicle_Details]  WITH CHECK ADD  CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Details_Vehicle_Type] FOREIGN KEY([Vehicle_Type_ID])
REFERENCES [dbo].[Vehicle_Type] ([Vehicle_Type_ID])
GO
ALTER TABLE [dbo].[Vehicle_Inspection_Vehicle_Details] CHECK CONSTRAINT [FK_Vehicle_Inspection_Vehicle_Details_Vehicle_Type]
GO
USE [master]
GO
ALTER DATABASE [Qantam] SET  READ_WRITE 
GO
