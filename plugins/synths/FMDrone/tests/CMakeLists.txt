# ============================================================================
# Test Configuration
# Uses Catch2 for unit testing
# ============================================================================

# Fetch Catch2
include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.4.0
)
FetchContent_MakeAvailable(Catch2)

# ============================================================================
# Test Executable
# ============================================================================

add_executable(${PROJECT_NAME}_Tests
    # DSP Tests
    test_voice.cpp
    test_engine.cpp

    # TODO: Add more test files
    # test_oscillators.cpp
    # test_filters.cpp
    # test_envelopes.cpp
    # test_integration.cpp
)

# ============================================================================
# Link Libraries
# ============================================================================

target_link_libraries(${PROJECT_NAME}_Tests
    PRIVATE
        Catch2::Catch2WithMain
        sst-libraries
)

# ============================================================================
# Include Directories
# ============================================================================

target_include_directories(${PROJECT_NAME}_Tests
    PRIVATE
        ${CMAKE_SOURCE_DIR}/source
        ${CMAKE_SOURCE_DIR}/source/dsp
)

# ============================================================================
# Register Tests with CTest
# ============================================================================

include(CTest)
include(Catch)
catch_discover_tests(${PROJECT_NAME}_Tests)

# ============================================================================
# Test Utilities
# ============================================================================

# Optional: Create a shared test utilities library
# add_library(TestUtils STATIC
#     utils/TestSignals.cpp
#     utils/SignalAnalysis.cpp
# )
# target_link_libraries(TestUtils PUBLIC sst-libraries)
# target_link_libraries(${PROJECT_NAME}_Tests PRIVATE TestUtils)
